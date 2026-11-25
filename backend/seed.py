import os
import sys
import httpx

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8000")


def register_or_login(client: httpx.Client, email: str, password: str, full_name: str, role: str) -> dict:
    reg = client.post(
        f"{GATEWAY_URL}/api/auth/register",
        json={"email": email, "password": password, "full_name": full_name, "role": role},
    )
    if reg.status_code not in (201, 409):
        reg.raise_for_status()
    login = client.post(f"{GATEWAY_URL}/api/auth/login", json={"email": email, "password": password})
    login.raise_for_status()
    return login.json()


def main():
    with httpx.Client(timeout=15.0) as client:
        # 1 Admin, 2 Teachers, 5 Students
        admin_auth = register_or_login(client, "amine.benamor@isi.utm.tn", "exammanager", "Amine Ben Amor", "ADMIN")
        headers = {"Authorization": f"Bearer {admin_auth['access_token']}"}

        t1_auth = register_or_login(client, "leila.trabelsi@isi.utm.tn", "exammanager", "Leïla Trabelsi", "TEACHER")
        t2_auth = register_or_login(client, "sami.gharbi@isi.utm.tn", "exammanager", "Sami Gharbi", "TEACHER")

        students_data = [
            ("yasmine.benamor@isi.utm.tn", "Yasmine Ben Amor", "2201843"),
            ("aziz.chaabane@isi.utm.tn", "Aziz Chaabane", "2201921"),
            ("mariem.gharbi@isi.utm.tn", "Mariem Gharbi", "2201756"),
            ("rayen.jebali@isi.utm.tn", "Rayen Jebali", "2202014"),
            ("ines.mansour@isi.utm.tn", "Inès Mansour", "2201888"),
        ]
        student_auths = []
        for email, name, mat in students_data:
            auth = register_or_login(client, email, "exammanager", name, "STUDENT")
            student_auths.append((auth["user"]["id"], name, email, mat))

        # Groups
        groups = [
            {"code": "GL3", "name": "3ème année GL · Groupe A", "student_count": 32, "academic_year": "2024/2025", "status": "Actif"},
            {"code": "L2 INFO", "name": "2ème année Informatique", "student_count": 34, "academic_year": "2024/2025", "status": "Actif"},
        ]
        for g in groups:
            r = client.post(f"{GATEWAY_URL}/api/users/groups", json=g, headers=headers)
            if r.status_code not in (201, 409):
                r.raise_for_status()
        all_groups = client.get(f"{GATEWAY_URL}/api/users/groups", headers=headers).json()
        gl3_id = next(g["id"] for g in all_groups if g["code"] == "GL3")

        # Teachers
        for auth_obj, dept in [(t1_auth, "Génie Logiciel"), (t2_auth, "Informatique")]:
            u = auth_obj["user"]
            r = client.post(
                f"{GATEWAY_URL}/api/users/teachers",
                json={"auth_user_id": u["id"], "full_name": u["full_name"], "email": u["email"], "department": dept},
                headers=headers,
            )
            if r.status_code not in (201, 409):
                r.raise_for_status()
        all_teachers = client.get(f"{GATEWAY_URL}/api/users/teachers", headers=headers).json()
        t1_id = all_teachers[0]["id"]
        t2_id = all_teachers[1]["id"] if len(all_teachers) > 1 else t1_id

        # Students
        for auth_uid, name, email, mat in student_auths:
            r = client.post(
                f"{GATEWAY_URL}/api/users/students",
                json={"auth_user_id": auth_uid, "matricule": mat, "full_name": name, "email": email, "group_id": gl3_id},
                headers=headers,
            )
            if r.status_code not in (201, 409):
                r.raise_for_status()
        all_students = client.get(f"{GATEWAY_URL}/api/users/students", headers=headers).json()

        # Subjects
        subjects = [
            {"code": "GL301", "name": "Génie Logiciel", "teacher_id": t1_id, "teacher_name": "Leïla Trabelsi", "level": "GL3", "credits": 6},
            {"code": "BD202", "name": "Bases de Données", "teacher_id": t2_id, "teacher_name": "Sami Gharbi", "level": "L2 INFO", "credits": 5},
            {"code": "SOA305", "name": "Architecture SOA", "teacher_id": t1_id, "teacher_name": "Leïla Trabelsi", "level": "GL3", "credits": 4},
        ]
        for s in subjects:
            r = client.post(f"{GATEWAY_URL}/api/users/subjects", json=s, headers=headers)
            if r.status_code not in (201, 409):
                r.raise_for_status()

        # 3 Rooms
        rooms = [
            {"name": "Amphi A", "building": "Bâtiment principal", "floor": "RDC", "capacity": 120, "available": True, "usage_rate": 78},
            {"name": "Salle B12", "building": "Bloc B", "floor": "1er étage", "capacity": 64, "available": True, "usage_rate": 92},
            {"name": "Salle C04", "building": "Bloc C", "floor": "RDC", "capacity": 48, "available": True, "usage_rate": 45},
        ]
        for rm in rooms:
            r = client.post(f"{GATEWAY_URL}/api/rooms", json=rm, headers=headers)
            if r.status_code not in (201, 409):
                r.raise_for_status()
        all_rooms = client.get(f"{GATEWAY_URL}/api/rooms", headers=headers).json()
        room_map = {r["name"]: r["id"] for r in all_rooms}

        # 4 Exams (includes 1 overlap on Salle B12 to demonstrate conflict detection)
        existing_exams = client.get(f"{GATEWAY_URL}/api/exams", headers=headers).json()
        if len(existing_exams) == 0:
            exams = [
                {
                    "subject_name": "Génie Logiciel",
                    "department": "Génie Logiciel",
                    "exam_date": "2025-06-03",
                    "start_time": "08:30:00",
                    "duration_minutes": 90,
                    "status": "Planifié",
                    "room_id": room_map.get("Amphi A"),
                    "room_name": "Amphi A",
                    "group_id": gl3_id,
                    "group_name": "GL3",
                    "supervisor_ids": [t1_id],
                },
                {
                    "subject_name": "Bases de Données",
                    "department": "Informatique",
                    "exam_date": "2025-06-03",
                    "start_time": "10:30:00",
                    "duration_minutes": 120,
                    "status": "En cours",
                    "room_id": room_map.get("Salle B12"),
                    "room_name": "Salle B12",
                    "group_name": "L2 INFO",
                    "supervisor_ids": [t2_id],
                },
                {
                    "subject_name": "Architecture SOA",
                    "department": "Génie Logiciel",
                    "exam_date": "2025-06-03",
                    "start_time": "11:00:00",
                    "duration_minutes": 90,
                    "status": "Planifié",
                    "room_id": room_map.get("Salle B12"),
                    "room_name": "Salle B12",
                    "group_id": gl3_id,
                    "group_name": "GL3",
                    "supervisor_ids": [t1_id],
                },
                {
                    "subject_name": "Réseaux Avancés",
                    "department": "Réseaux",
                    "exam_date": "2025-06-05",
                    "start_time": "14:00:00",
                    "duration_minutes": 90,
                    "status": "Planifié",
                    "room_id": room_map.get("Salle C04"),
                    "room_name": "Salle C04",
                    "group_id": gl3_id,
                    "group_name": "GL3",
                    "supervisor_ids": [t2_id],
                },
            ]
            for ex in exams:
                client.post(f"{GATEWAY_URL}/api/exams", json=ex, headers=headers).raise_for_status()
            existing_exams = client.get(f"{GATEWAY_URL}/api/exams", headers=headers).json()

        # Assign supervisor on first exam
        if existing_exams:
            client.post(
                f"{GATEWAY_URL}/api/users/supervisors",
                json={"exam_id": existing_exams[0]["id"], "teacher_id": t1_id},
                headers=headers,
            )

        # Seed grades for the 5 students on exam 1 and publish them
        if existing_exams and all_students:
            exam1 = existing_exams[0]
            sample_scores = [15.5, 12.75, 16.25, 9.5, 14.0]
            for stu, sc in zip(all_students[:5], sample_scores):
                client.post(
                    f"{GATEWAY_URL}/api/grades",
                    json={
                        "exam_id": exam1["id"],
                        "subject_name": exam1["subject_name"],
                        "student_id": stu["id"],
                        "student_matricule": stu["matricule"],
                        "student_name": stu["full_name"],
                        "score": sc,
                        "published": True,
                    },
                    headers=headers,
                ).raise_for_status()
            client.post(f"{GATEWAY_URL}/api/grades/publish", json={"exam_id": exam1["id"]}, headers=headers)

        print("Seed completed: 1 admin, 2 teachers, 5 students, 3 rooms, 4 exams, grades & notifications.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Seed failed: {exc}", file=sys.stderr)
        sys.exit(1)
