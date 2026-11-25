from datetime import datetime
import httpx
from spyne import Application, Array, Boolean, ComplexModel, Float, Integer, ServiceBase, Unicode, rpc
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication

from app.config import settings


class ExamInfo(ComplexModel):
    exam_id = Integer
    subject_name = Unicode
    exam_date = Unicode
    start_time = Unicode
    duration_minutes = Integer
    room_name = Unicode
    group_name = Unicode
    status = Unicode


class GradeInfo(ComplexModel):
    subject_name = Unicode
    score = Float
    status = Unicode


class TranscriptResult(ComplexModel):
    student_id = Integer
    matricule = Unicode
    full_name = Unicode
    average = Float
    decision = Unicode
    grades = Array(GradeInfo)


class ConvocationResult(ComplexModel):
    student_id = Integer
    matricule = Unicode
    student_name = Unicode
    group_name = Unicode
    exam_id = Integer
    subject_name = Unicode
    exam_date = Unicode
    start_time = Unicode
    duration_minutes = Integer
    room_name = Unicode
    building = Unicode


class RoomAvailabilityResult(ComplexModel):
    room_id = Integer
    room_name = Unicode
    capacity = Integer
    available = Boolean
    reason = Unicode


def _fetch_json(url: str) -> dict | list:
    with httpx.Client(timeout=5.0) as client:
        resp = client.get(url)
        resp.raise_for_status()
        return resp.json()


def _to_minutes(hhmm: str) -> int:
    parts = hhmm.split(":")
    return int(parts[0]) * 60 + int(parts[1])


class ExamManagerSoapService(ServiceBase):
    @rpc(Integer, _returns=Array(ExamInfo))
    def getExamsByStudent(ctx, student_id):
        student = _fetch_json(f"{settings.USER_SERVICE_URL}/users/students/{student_id}")
        groups = _fetch_json(f"{settings.USER_SERVICE_URL}/users/groups")
        group = next((g for g in groups if g["id"] == student.get("group_id")), None)
        group_code = group["code"] if group else None

        exams = _fetch_json(f"{settings.EXAM_SERVICE_URL}/exams")
        filtered = [e for e in exams if not group_code or e.get("group_name") == group_code]
        return [
            ExamInfo(
                exam_id=e["id"],
                subject_name=e["subject_name"],
                exam_date=str(e["exam_date"]),
                start_time=str(e["start_time"])[:5],
                duration_minutes=int(e["duration_minutes"]),
                room_name=e["room_name"],
                group_name=e["group_name"],
                status=e["status"],
            )
            for e in filtered
        ]

    @rpc(Integer, _returns=TranscriptResult)
    def getStudentTranscript(ctx, student_id):
        student = _fetch_json(f"{settings.USER_SERVICE_URL}/users/students/{student_id}")
        grades = _fetch_json(
            f"{settings.GRADE_SERVICE_URL}/grades?student_id={student_id}&published_only=true"
        )
        avg = round(sum(g["score"] for g in grades) / len(grades), 2) if grades else 0.0
        decision = "Admis" if avg >= 10.0 else "Ajourné"
        return TranscriptResult(
            student_id=student["id"],
            matricule=student["matricule"],
            full_name=student["full_name"],
            average=avg,
            decision=decision,
            grades=[
                GradeInfo(
                    subject_name=g["subject_name"],
                    score=float(g["score"]),
                    status="Admis" if float(g["score"]) >= 10.0 else "Ajourné",
                )
                for g in grades
            ],
        )

    @rpc(Integer, Integer, _returns=ConvocationResult)
    def getExamConvocation(ctx, student_id, exam_id):
        student = _fetch_json(f"{settings.USER_SERVICE_URL}/users/students/{student_id}")
        exam = _fetch_json(f"{settings.EXAM_SERVICE_URL}/exams/{exam_id}")
        rooms = _fetch_json(f"{settings.ROOM_SERVICE_URL}/rooms")
        room = next(
            (r for r in rooms if r["id"] == exam.get("room_id") or r["name"] == exam.get("room_name")),
            None,
        )
        building = f"{room['building']} · {room['floor']}" if room else "Bâtiment principal"
        return ConvocationResult(
            student_id=student["id"],
            matricule=student["matricule"],
            student_name=student["full_name"],
            group_name=exam["group_name"],
            exam_id=exam["id"],
            subject_name=exam["subject_name"],
            exam_date=str(exam["exam_date"]),
            start_time=str(exam["start_time"])[:5],
            duration_minutes=int(exam["duration_minutes"]),
            room_name=exam["room_name"],
            building=building,
        )

    @rpc(Integer, Unicode, Unicode, Integer, _returns=RoomAvailabilityResult)
    def checkRoomAvailability(ctx, room_id, exam_date, start_time, duration_minutes):
        room = _fetch_json(f"{settings.ROOM_SERVICE_URL}/rooms/{room_id}")
        exams = _fetch_json(f"{settings.EXAM_SERVICE_URL}/exams")
        req_start = _to_minutes(start_time)
        req_end = req_start + int(duration_minutes)

        conflict = None
        for e in exams:
            if e.get("status") == "Annulé":
                continue
            if str(e.get("exam_date")) != str(exam_date):
                continue
            if e.get("room_id") != room_id and e.get("room_name") != room["name"]:
                continue
            e_start = _to_minutes(str(e["start_time"])[:5])
            e_end = e_start + int(e["duration_minutes"])
            if req_start < e_end and e_start < req_end:
                conflict = e["subject_name"]
                break

        is_avail = bool(room["available"]) and conflict is None
        reason = (
            "Disponible"
            if is_avail
            else (f"Occupée par {conflict}" if conflict else "Salle marquée indisponible")
        )
        return RoomAvailabilityResult(
            room_id=room["id"],
            room_name=room["name"],
            capacity=int(room["capacity"]),
            available=is_avail,
            reason=reason,
        )


soap_app = Application(
    [ExamManagerSoapService],
    tns="urn:exammanager:soap",
    in_protocol=Soap11(validator="lxml"),
    out_protocol=Soap11(),
)
wsgi_soap_app = WsgiApplication(soap_app)
