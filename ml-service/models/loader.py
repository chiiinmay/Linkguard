"""
models/loader.py — Loads trained models at startup and holds them in memory.
"""
import os
import logging
from pathlib import Path
import joblib
import numpy as np

log = logging.getLogger("model-loader")
MODEL_DIR = Path(os.getenv("MODEL_DIR", "./saved_models"))


class ModelLoader:
    """Singleton-style model container loaded once at app startup."""

    def __init__(self):
        self.lr_pipeline   = None   # sklearn Pipeline (scaler + LogisticRegression)
        self.nb_model      = None   # GaussianNB
        self.bert_tokenizer = None
        self.bert_model     = None
        self.device         = os.getenv("DEVICE", "cpu")
        self._bert_available = False

    def load_all(self):
        self._load_basic()
        self._load_bert()

    # ── Basic models ──────────────────────────────────────────────
    def _load_basic(self):
        lr_path = MODEL_DIR / "logistic_regression.pkl"
        nb_path = MODEL_DIR / "naive_bayes.pkl"

        if lr_path.exists():
            self.lr_pipeline = joblib.load(lr_path)
            log.info("LogisticRegression loaded ✓")
        else:
            log.warning(f"logistic_regression.pkl not found at {lr_path}. Run train.py first.")

        if nb_path.exists():
            self.nb_model = joblib.load(nb_path)
            log.info("NaiveBayes loaded ✓")
        else:
            log.warning(f"naive_bayes.pkl not found at {nb_path}.")

    # ── BERT ──────────────────────────────────────────────────────
    def _load_bert(self):
        bert_dir = MODEL_DIR / "bert_finetuned"
        if not bert_dir.exists():
            log.warning(f"BERT model not found at {bert_dir}. Run: python train.py --model advanced")
            return
        try:
            import torch
            from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
            self.bert_tokenizer = DistilBertTokenizerFast.from_pretrained(str(bert_dir))
            self.bert_model     = DistilBertForSequenceClassification.from_pretrained(str(bert_dir))
            self.bert_model.eval()
            if self.device == "cuda" and torch.cuda.is_available():
                self.bert_model = self.bert_model.cuda()
            self._bert_available = True
            log.info(f"BERT loaded ✓ (device={self.device})")
        except Exception as e:
            log.error(f"Failed to load BERT: {e}")

    @property
    def bert_available(self) -> bool:
        return self._bert_available

    # ── Inference helpers ─────────────────────────────────────────
    def predict_basic(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Returns (predicted_class_array, proba_matrix) using LR (preferred) or NB fallback."""
        if self.lr_pipeline is not None:
            proba = self.lr_pipeline.predict_proba(X)
            preds = self.lr_pipeline.predict(X)
        elif self.nb_model is not None:
            proba = self.nb_model.predict_proba(X)
            preds = self.nb_model.predict(X)
        else:
            raise RuntimeError("No basic models loaded. Run: python train.py --model basic")
        return preds, proba

    def predict_bert(self, urls: list[str]) -> tuple[np.ndarray, np.ndarray]:
        """Returns (predicted_class_array, proba_matrix) using fine-tuned BERT."""
        if not self._bert_available:
            raise RuntimeError("BERT not loaded. Run: python train.py --model advanced")
        import torch
        enc = self.bert_tokenizer(
            urls, padding=True, truncation=True, max_length=128, return_tensors="pt"
        )
        if self.device == "cuda":
            enc = {k: v.cuda() for k, v in enc.items()}
        with torch.no_grad():
            logits = self.bert_model(**enc).logits
        proba = torch.softmax(logits, dim=-1).cpu().numpy()
        preds = np.argmax(proba, axis=1)
        return preds, proba
