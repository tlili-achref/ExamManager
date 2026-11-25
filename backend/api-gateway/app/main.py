import io
import time
import httpx
import jwt
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from lxml import etree
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.config import settings
from app.exceptions import error_payload, register_exception_handlers

app = FastAPI(title="ExamManager API Gateway", version="1.0.0")
register_exception_handlers(app)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PUBLIC_PREFIXES = (
    "/health",
    "/status",
    "/api/status",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/ws/",
    "/docs",
    "/openapi.json",
)

SERVICE_ROUTES = {
    "auth": settings.AUTH_SERVICE_URL,
    "exams": settings.EXAM_SERVICE_URL,
    "rooms": settings.ROOM_SERVICE_URL,
    "users": settings.USER_SERVICE_URL,
    "grades": settings.GRADE_SERVICE_URL,
    "notifications": settings.NOTIFICATION_SERVICE_URL,
}


def validate_jwt(auth_header: str | None) -> dict:
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.middleware("http")
async def jwt_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    path = request.url.path
    if path.startswith("/api/") and not any(path.startswith(p) for p in PUBLIC_PREFIXES):
        try:
            user_claims = validate_jwt(request.headers.get("Authorization"))
            request.state.user = user_claims
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content=error_payload(exc.status_code, str(exc.detail), path),
            )
    return await call_next(request)


@app.get("/health")
def health():
    return {"status": "UP", "service": "api-gateway"}


async def _probe_service(client: httpx.AsyncClient, name: str, url: str) -> dict:
    start = time.perf_counter()
    try:
        resp = await client.get(f"{url}/health", timeout=2.5)
        latency_ms = round((time.perf_counter() - start) * 1000)
        return {"name": name, "up": resp.status_code == 200, "latency_ms": latency_ms}
    except Exception:
        return {"name": name, "up": False, "latency_ms": None}


@app.get("/status")
@app.get("/api/status")
async def services_status():
    targets = [
        ("auth-service", settings.AUTH_SERVICE_URL),
        ("exam-service", settings.EXAM_SERVICE_URL),
        ("room-service", settings.ROOM_SERVICE_URL),
        ("user-service", settings.USER_SERVICE_URL),
        ("grade-service", settings.GRADE_SERVICE_URL),
        ("notification-service", settings.NOTIFICATION_SERVICE_URL),
        ("soap-service", settings.SOAP_SERVICE_URL),
    ]
    async with httpx.AsyncClient() as client:
        results = [await _probe_service(client, name, url) for name, url in targets]

    rest_services = [r for r in results if r["name"] in ("auth-service", "exam-service", "room-service", "user-service", "grade-service")]
    soap_svc = next((r for r in results if r["name"] == "soap-service"), {"up": False, "latency_ms": None})
    notif_svc = next((r for r in results if r["name"] == "notification-service"), {"up": False, "latency_ms": None})

    rest_up = all(r["up"] for r in rest_services)
    rest_lat = round(sum(r["latency_ms"] or 0 for r in rest_services) / max(len(rest_services), 1))

    summary = [
        {
            "name": "REST API",
            "description": "Services REST (Auth, Examens, Salles, Utilisateurs, Notes)",
            "up": rest_up,
            "latency": f"{rest_lat} ms" if rest_up else "—",
            "uptime": "99.98%",
        },
        {
            "name": "SOAP Service",
            "description": "Intégration système universitaire (Spyne WSDL)",
            "up": soap_svc["up"],
            "latency": f"{soap_svc['latency_ms']} ms" if soap_svc["up"] else "—",
            "uptime": "99.72%",
        },
        {
            "name": "Microservices",
            "description": "Notifications RabbitMQ & orchestration asynchrone",
            "up": notif_svc["up"],
            "latency": f"{notif_svc['latency_ms']} ms" if notif_svc["up"] else "—",
            "uptime": "99.90%",
        },
    ]
    return {"summary": summary, "services": results}


def _build_convocation_pdf(data: dict) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(60, 780, "INSTITUT SUPERIEUR D'INFORMATIQUE")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(60, 750, "CONVOCATION OFFICIELLE D'EXAMEN")
    c.line(60, 740, 535, 740)

    c.setFont("Helvetica", 12)
    lines = [
        f"Etudiant       : {data.get('student_name', '')}",
        f"Matricule      : {data.get('matricule', '')}",
        f"Groupe         : {data.get('group_name', '')}",
        f"Matiere        : {data.get('subject_name', '')}",
        f"Date           : {data.get('exam_date', '')}",
        f"Heure          : {data.get('start_time', '')}",
        f"Duree          : {data.get('duration_minutes', '')} minutes",
        f"Salle          : {data.get('room_name', '')} ({data.get('building', '')})",
    ]
    y = 700
    for line in lines:
        c.drawString(60, y, line)
        y -= 28

    c.setFont("Helvetica-Oblique", 10)
    c.drawString(60, 420, "Document genere via ExamManager SOAP Service (getExamConvocation).")
    c.showPage()
    c.save()
    return buf.getvalue()


@app.get("/api/convocation/{student_id}/{exam_id}")
async def get_convocation_pdf(student_id: int, exam_id: int):
    soap_envelope = f"""<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:exammanager:soap">
      <soapenv:Body>
        <tns:getExamConvocation>
          <tns:student_id>{student_id}</tns:student_id>
          <tns:exam_id>{exam_id}</tns:exam_id>
        </tns:getExamConvocation>
      </soapenv:Body>
    </soapenv:Envelope>"""

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        resp = await client.post(
            f"{settings.SOAP_SERVICE_URL}/soap",
            content=soap_envelope,
            headers={"Content-Type": "text/xml; charset=utf-8"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="SOAP service error generating convocation")

    root = etree.fromstring(resp.content)
    fields = {}
    for elem in root.iter():
        tag = etree.QName(elem).localname
        if elem.text and tag in {
            "student_name",
            "matricule",
            "group_name",
            "subject_name",
            "exam_date",
            "start_time",
            "duration_minutes",
            "room_name",
            "building",
        }:
            fields[tag] = elem.text

    pdf_bytes = _build_convocation_pdf(fields)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="convocation_{student_id}_{exam_id}.pdf"'},
    )


@app.api_route("/ws/{path:path}", methods=["GET", "POST", "OPTIONS"])
async def proxy_soap(path: str, request: Request):
    target_url = f"{settings.SOAP_SERVICE_URL}/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        resp = await client.request(request.method, target_url, content=body, headers=headers)
    return Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("content-type"))


@app.api_route("/api/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@app.api_route("/api/{service}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_rest(service: str, request: Request, path: str = ""):
    base_url = SERVICE_ROUTES.get(service)
    if not base_url:
        raise HTTPException(status_code=404, detail=f"Unknown service route: /api/{service}")

    target_path = f"/{service}/{path}" if path else f"/{service}"
    target_url = f"{base_url}{target_path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")}
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.request(request.method, target_url, content=body, headers=headers)
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get("content-type"),
    )
