# ExamManager

University Exam Management System built with a **Microservices Architecture** combining **REST APIs (FastAPI)**, a **Contract-First SOAP Web Service (Spyne)**, **Event-Driven Messaging (RabbitMQ + aio-pika)**, and a **React + Vite** frontend.

## Architecture

```
Frontend (React :5173)
   │
   ▼
API Gateway (:8000) ──► GET /status, JWT Auth, CORS, PDF Convocation
   ├── /api/auth/**          ──► auth-service (:8001)          ──► auth_db
   ├── /api/exams/**         ──► exam-service (:8002)          ──► exam_db ──► RabbitMQ
   ├── /api/rooms/**         ──► room-service (:8003)          ──► room_db
   ├── /api/users/**         ──► user-service (:8004)          ──► user_db
   ├── /api/grades/**        ──► grade-service (:8005)         ──► grade_db ──► RabbitMQ
   ├── /api/notifications/** ──► notification-service (:8006)  ──► notification_db ◄── RabbitMQ
   └── /ws/**                ──► soap-service (:8007)          ──► aggregates via httpx
```

## Ports

| Service | Port | Swagger / WSDL |
|---|---|---|
| `api-gateway` | `8000` | `http://localhost:8000/docs` |
| `auth-service` | `8001` | `http://localhost:8001/docs` |
| `exam-service` | `8002` | `http://localhost:8002/docs` |
| `room-service` | `8003` | `http://localhost:8003/docs` |
| `user-service` | `8004` | `http://localhost:8004/docs` |
| `grade-service` | `8005` | `http://localhost:8005/docs` |
| `notification-service` | `8006` | `http://localhost:8006/docs` |
| `soap-service` | `8007` | `http://localhost:8000/ws/soap?wsdl` |
| PostgreSQL | `5432` | — |
| RabbitMQ | `5672` / `15672` | Management UI `:15672` |
| Frontend (Vite) | `5173` | `http://localhost:5173` |

## Run Instructions

1. **Start the backend stack:**
   ```bash
   cd backend
   docker compose up --build -d
   ```
2. **Seed initial data (1 admin, 2 teachers, 5 students, 3 rooms, 4 exams):**
   ```bash
   python seed.py
   ```
3. **Start the frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## Test Accounts (Password: `exammanager`)

| Role | Email | Password |
|---|---|---|
| `ADMIN` | `amine.benamor@isi.utm.tn` | `exammanager` |
| `TEACHER` | `leila.trabelsi@isi.utm.tn` | `exammanager` |
| `TEACHER` | `sami.gharbi@isi.utm.tn` | `exammanager` |
| `STUDENT` | `yasmine.benamor@isi.utm.tn` | `exammanager` |
| `STUDENT` | `aziz.chaabane@isi.utm.tn` | `exammanager` |

## Example REST & SOAP Calls

**Login (REST):**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"amine.benamor@isi.utm.tn","password":"exammanager"}'
```

**SOAP (`getExamConvocation` via Gateway):**
```bash
curl -X POST http://localhost:8000/ws/soap \
  -H "Content-Type: text/xml; charset=utf-8" \
  -d '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:exammanager:soap"><soapenv:Body><tns:getExamConvocation><tns:student_id>1</tns:student_id><tns:exam_id>1</tns:exam_id></tns:getExamConvocation></soapenv:Body></soapenv:Envelope>'
```
