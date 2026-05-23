"""
LinkGuard AI — Python FastAPI ML Microservice
Endpoints:
  POST /predict  — run a URL scan (basic or advanced)
  GET  /health   — liveness check
  GET  /models   — loaded model info
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv

load_dotenv()

from routers.predict import router as predict_router
from models.loader import ModelLoader

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("linkguard-ml")

# ── App lifecycle ─────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading ML models…")
    app.state.models = ModelLoader()
    app.state.models.load_all()
    logger.info("Models ready ✓")
    yield
    logger.info("Shutting down ML service")

app = FastAPI(
    title="LinkGuard ML Service",
    version="1.0.0",
    description="URL threat classification via Logistic Regression, Naive Bayes, and BERT",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/models")
def model_info(request_state=None):
    return {
        "basic":    ["LogisticRegression", "MultinomialNaiveBayes"],
        "advanced": "distilbert-base-uncased (fine-tuned)",
        "device":   os.getenv("DEVICE", "cpu"),
    }
