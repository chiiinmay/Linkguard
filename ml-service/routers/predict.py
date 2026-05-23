"""
routers/predict.py — POST /predict
Orchestrates feature extraction → model inference → SHAP → response building.
"""
import time
import logging
import numpy as np
from typing import Optional, Literal
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, HttpUrl, field_validator

from utils.features import extract_features, FEATURE_NAMES

log = logging.getLogger("predict")
router = APIRouter()

# ── Request / Response schemas ────────────────────────────────────
class PredictRequest(BaseModel):
    url:             str
    domain_age_days: Optional[int] = None
    redirect_count:  int = 0
    model:           Literal["basic", "advanced"] = "basic"

    @field_validator("url")
    @classmethod
    def must_be_url(cls, v):
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

class SignalResult(BaseModel):
    name:   str
    value:  str
    status: Literal["ok", "warn", "bad"]

class PredictResponse(BaseModel):
    verdict:               str
    threat_type:           str
    confidence:            float
    threat_score:          int
    explanation:           str
    signals:               list[SignalResult]
    model_used:            str
    duration_ms:           int

# ── Label mappings ────────────────────────────────────────────────
CLASS_TO_THREAT = {
    0: "clean",
    1: "phishing",
    2: "honeytrap",
    3: "scam",
    4: "malware",
}
CLASS_TO_VERDICT = {
    0: "safe",
    1: "dangerous",
    2: "suspicious",
    3: "suspicious",
    4: "dangerous",
}

def _score_from_proba(proba: np.ndarray) -> int:
    """Convert class probability vector to a 0-100 threat score."""
    # Weighted: malware=100, phishing=90, scam=75, honeytrap=60, safe=0
    weights = np.array([0, 90, 60, 75, 100], dtype=float)
    score = float(np.dot(proba, weights))
    return min(100, max(0, int(round(score))))

def _build_explanation(threat_type: str, confidence: float, signals: list[SignalResult]) -> str:
    """Build a plain-language explanation."""
    bad_signals = [s for s in signals if s.status == "bad"]
    warn_signals = [s for s in signals if s.status == "warn"]

    if threat_type == "clean":
        return (f"This URL appears safe. No threat indicators detected "
                f"({int(confidence * 100)}% confidence).")

    parts = []
    if threat_type == "phishing":
        parts.append("This page appears to be a credential-theft (phishing) site")
    elif threat_type == "honeytrap":
        parts.append("This page shows signs of a honeytrap — social engineering or romance bait")
    elif threat_type == "scam":
        parts.append("This page exhibits scam patterns — fake prizes, investment fraud, or impersonation")
    elif threat_type == "malware":
        parts.append("This URL may distribute malware or unwanted software")

    if bad_signals:
        reasons = ", ".join(s.name.lower() for s in bad_signals[:3])
        parts.append(f"Key indicators: {reasons}.")
    if warn_signals:
        parts.append(f"{len(warn_signals)} additional warning signal(s) detected.")

    parts.append(f"Model confidence: {int(confidence * 100)}%.")
    return " ".join(parts)

def _features_to_signals(X: np.ndarray, shap_values: Optional[np.ndarray]) -> list[SignalResult]:
    """Convert feature vector (+ optional SHAP) into human-readable signal cards."""
    results: list[SignalResult] = []

    # Always surface the most interpretable features
    key_indices = {
        FEATURE_NAMES.index("has_https"):          ("HTTPS",           lambda v: ("ok" if v else "bad"),    lambda v: "Yes" if v else "No"),
        FEATURE_NAMES.index("brand_lookalike"):    ("Brand lookalike",  lambda v: ("bad" if v else "ok"),   lambda v: "Detected" if v else "None"),
        FEATURE_NAMES.index("risky_tld"):          ("Risky TLD",       lambda v: ("bad" if v else "ok"),    lambda v: "Yes" if v else "No"),
        FEATURE_NAMES.index("ip_as_host"):         ("IP as hostname",  lambda v: ("bad" if v else "ok"),    lambda v: "Yes" if v else "No"),
        FEATURE_NAMES.index("domain_age_days"):    ("Domain age",      _age_status,                          _age_label),
        FEATURE_NAMES.index("very_new_domain"):    ("Brand-new domain",lambda v: ("bad" if v else "ok"),    lambda v: "Yes (<7d)" if v else "No"),
        FEATURE_NAMES.index("redirect_count"):     ("Redirects",       _redirect_status,                    lambda v: f"{int(v)} hop(s)"),
        FEATURE_NAMES.index("suspicious_keyword_hit"): ("Suspicious keywords", lambda v: ("warn" if v else "ok"), lambda v: "Detected" if v else "None"),
        FEATURE_NAMES.index("url_entropy"):        ("URL entropy",     _entropy_status,                     lambda v: f"{v:.2f}"),
        FEATURE_NAMES.index("url_length"):         ("URL length",      lambda v: ("warn" if v > 75 else "ok"), lambda v: f"{int(v)} chars"),
    }

    for idx, (name, status_fn, label_fn) in key_indices.items():
        val = float(X[0, idx])
        results.append(SignalResult(name=name, value=label_fn(val), status=status_fn(val)))

    # If SHAP available, also surface top SHAP features not already included
    if shap_values is not None:
        shap_abs   = np.abs(shap_values[0])
        top_shap   = np.argsort(shap_abs)[::-1]
        existing   = set(key_indices.keys())
        added = 0
        for idx in top_shap:
            if idx not in existing and added < 3:
                fname = FEATURE_NAMES[idx]
                val   = float(X[0, idx])
                sval  = float(shap_values[0, idx])
                status = "bad" if sval > 0.05 else "warn" if sval > 0 else "ok"
                results.append(SignalResult(name=fname.replace("_", " ").title(),
                                            value=f"{val:.2f}", status=status))
                added += 1

    return results[:12]   # cap at 12 signals for UI

def _age_status(v):
    if v < 0:   return "warn"   # unknown
    if v < 7:   return "bad"
    if v < 30:  return "warn"
    return "ok"

def _age_label(v):
    if v < 0:   return "Unknown"
    if v == 0:  return "<1 day"
    return f"{int(v)} days"

def _redirect_status(v):
    if v > 3:  return "bad"
    if v > 1:  return "warn"
    return "ok"

def _entropy_status(v):
    if v > 4.5: return "bad"
    if v > 3.8: return "warn"
    return "ok"

# ── Main endpoint ─────────────────────────────────────────────────
@router.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest, request: Request):
    t0 = time.perf_counter()
    models = request.app.state.models

    # ── Extract features ──────────────────────────────────────────
    domain_age = req.domain_age_days if req.domain_age_days is not None else 0
    X = extract_features(req.url, req.domain_age_days, req.redirect_count).reshape(1, -1)

    # ── Run inference ─────────────────────────────────────────────
    shap_values = None
    model_used  = "basic"

    if req.model == "advanced" and models.bert_available:
        try:
            preds, proba = models.predict_bert([req.url])
            model_used   = "advanced"
        except Exception as e:
            log.warning(f"BERT failed ({e}), falling back to basic")
            preds, proba = models.predict_basic(X)
    else:
        preds, proba = models.predict_basic(X)

    predicted_class = int(preds[0])
    class_proba     = proba[0]     # shape (5,)
    confidence      = float(class_proba[predicted_class])
    threat_score    = _score_from_proba(class_proba)

    # ── SHAP explanations (basic model only — fast) ───────────────
    if model_used == "basic" and models.lr_pipeline is not None:
        try:
            import shap
            explainer   = shap.LinearExplainer(
                models.lr_pipeline.named_steps["clf"],
                shap.maskers.Independent(X, max_samples=50),
            )
            shap_output = explainer.shap_values(
                models.lr_pipeline.named_steps["scaler"].transform(X)
            )
            # shap_output is list[array] for multi-class; pick predicted class
            if isinstance(shap_output, list):
                shap_values = shap_output[predicted_class]
            else:
                shap_values = shap_output
        except Exception as e:
            log.debug(f"SHAP skipped: {e}")

    # ── Build response ────────────────────────────────────────────
    threat_type = CLASS_TO_THREAT.get(predicted_class, "unknown")
    verdict     = CLASS_TO_VERDICT.get(predicted_class, "suspicious")
    signals     = _features_to_signals(X, shap_values)
    explanation = _build_explanation(threat_type, confidence, signals)
    duration_ms = int((time.perf_counter() - t0) * 1000)

    log.info(f"Predicted: {verdict}/{threat_type} score={threat_score} conf={confidence:.3f} [{model_used}] {duration_ms}ms")

    return PredictResponse(
        verdict=verdict,
        threat_type=threat_type,
        confidence=round(confidence, 4),
        threat_score=threat_score,
        explanation=explanation,
        signals=signals,
        model_used=model_used,
        duration_ms=duration_ms,
    )
