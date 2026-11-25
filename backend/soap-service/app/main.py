from a2wsgi import WSGIMiddleware
from fastapi import FastAPI

from app.soap_app import wsgi_soap_app

app = FastAPI(title="ExamManager SOAP Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "UP", "service": "soap-service"}


app.mount("/soap", WSGIMiddleware(wsgi_soap_app))
