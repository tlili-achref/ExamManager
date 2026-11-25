from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_wsdl_served_unit():
    resp = client.get("/soap?wsdl")
    assert resp.status_code == 200
    assert "getExamsByStudent" in resp.text
    assert "getStudentTranscript" in resp.text
    assert "getExamConvocation" in resp.text
    assert "checkRoomAvailability" in resp.text


def test_soap_convocation_integration():
    def fake_fetch(url: str):
        if "/users/students/1" in url:
            return {"id": 1, "matricule": "2201843", "full_name": "Yasmine Ben Amor", "group_id": 1}
        if "/exams/1" in url:
            return {
                "id": 1,
                "subject_name": "Génie Logiciel",
                "exam_date": "2025-06-03",
                "start_time": "08:30:00",
                "duration_minutes": 90,
                "room_id": 1,
                "room_name": "Amphi A",
                "group_name": "GL3",
            }
        if "/rooms" in url:
            return [{"id": 1, "name": "Amphi A", "building": "Bâtiment principal", "floor": "RDC"}]
        return {}

    soap_body = """<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:exammanager:soap">
      <soapenv:Body>
        <tns:getExamConvocation>
          <tns:student_id>1</tns:student_id>
          <tns:exam_id>1</tns:exam_id>
        </tns:getExamConvocation>
      </soapenv:Body>
    </soapenv:Envelope>"""

    with patch("app.soap_app._fetch_json", side_effect=fake_fetch):
        resp = client.post(
            "/soap",
            content=soap_body,
            headers={"Content-Type": "text/xml; charset=utf-8"},
        )
    assert resp.status_code == 200
    assert "Yasmine Ben Amor" in resp.text
    assert "Amphi A" in resp.text
