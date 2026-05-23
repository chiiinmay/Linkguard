"""
train.py — Train and save all LinkGuard ML models.

Usage:
  python train.py [--model basic|advanced|all]

Data:
  Place labeled_urls.csv in ./data/ with columns:
    url, label  (label: 0=safe, 1=phishing, 2=honeytrap, 3=scam, 4=malware)
  OR set USE_SYNTHETIC=1 to generate synthetic training data.
"""
import os
import sys
import argparse
import logging
import pickle
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, f1_score
from imblearn.over_sampling import SMOTE
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("train")

MODEL_DIR = Path(os.getenv("MODEL_DIR", "./saved_models"))
DATA_DIR  = Path("./data")
MODEL_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# ── Label mapping ─────────────────────────────────────────────────
VERDICT_MAP = {0: "safe", 1: "phishing", 2: "honeytrap", 3: "scam", 4: "malware"}
BINARY_VERDICT = {0: "safe", 1: "suspicious", 2: "suspicious", 3: "suspicious", 4: "dangerous"}

# ── Synthetic data generator (for testing without real data) ──────
def generate_synthetic_data(n: int = 5000) -> pd.DataFrame:
    """Generates a balanced synthetic dataset for smoke-testing the pipeline."""
    import random, string
    rng = np.random.default_rng(42)
    rows = []

    safe_domains = ["github.com","google.com","microsoft.com","amazon.com","stackoverflow.com",
                    "wikipedia.org","reddit.com","youtube.com","linkedin.com","twitter.com"]
    risky_tlds   = [".tk",".ml",".ga",".ru",".click",".top",".xyz",".pw"]

    for _ in range(n):
        label = rng.integers(0, 5)
        if label == 0:  # safe
            domain = random.choice(safe_domains)
            url    = f"https://{domain}/{''.join(rng.choice(list(string.ascii_lowercase), 8))}"
            age    = int(rng.integers(365, 5000))
        else:           # malicious
            tld    = random.choice(risky_tlds)
            rand   = ''.join(rng.choice(list(string.ascii_lowercase + string.digits), 12))
            url    = f"http://{rand}{tld}/verify/login?user=abc&pass=xyz"
            age    = int(rng.integers(0, 30))
        rows.append({"url": url, "label": label, "domain_age_days": age, "redirect_count": int(rng.integers(0,5))})

    return pd.DataFrame(rows)

# ── Load dataset ──────────────────────────────────────────────────
def load_dataset() -> pd.DataFrame:
    csv_path = DATA_DIR / "labeled_urls.csv"
    if os.getenv("USE_SYNTHETIC") == "1" or not csv_path.exists():
        log.warning("labeled_urls.csv not found — using synthetic data (not for production!)")
        return generate_synthetic_data(8000)
    df = pd.read_csv(csv_path)
    required = {"url", "label"}
    if not required.issubset(df.columns):
        raise ValueError(f"CSV must have columns: {required}")
    if "domain_age_days" not in df.columns:
        df["domain_age_days"] = -1
    if "redirect_count" not in df.columns:
        df["redirect_count"] = 0
    return df

# ── Feature extraction ────────────────────────────────────────────
def build_feature_matrix(df: pd.DataFrame) -> np.ndarray:
    from utils.features import extract_features
    log.info(f"Extracting features for {len(df)} rows…")
    X = np.vstack([
        extract_features(row.url, row.domain_age_days, row.redirect_count)
        for row in df.itertuples()
    ])
    return X

# ── Train basic models ────────────────────────────────────────────
def train_basic(df: pd.DataFrame):
    log.info("=== Training BASIC models (LR + NB) ===")
    X = build_feature_matrix(df)
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Handle class imbalance
    smote = SMOTE(random_state=42)
    X_res, y_res = smote.fit_resample(X_train, y_train)
    log.info(f"After SMOTE: {X_res.shape[0]} samples")

    # ── Logistic Regression pipeline ─────────────────────────────
    lr_pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    LogisticRegression(max_iter=1000, C=1.0, class_weight="balanced",
                                      multi_class="multinomial", solver="lbfgs")),
    ])
    lr_pipe.fit(X_res, y_res)
    lr_preds = lr_pipe.predict(X_test)
    lr_f1 = f1_score(y_test, lr_preds, average="macro")
    log.info(f"LogisticRegression — macro-F1: {lr_f1:.4f}")
    log.info("\n" + classification_report(y_test, lr_preds,
        target_names=list(VERDICT_MAP.values())))

    joblib.dump(lr_pipe, MODEL_DIR / "logistic_regression.pkl")
    log.info("Saved: logistic_regression.pkl")

    # ── Naive Bayes pipeline ──────────────────────────────────────
    # GaussianNB works directly on the feature matrix
    nb_model = GaussianNB()
    nb_model.fit(X_res, y_res)
    nb_preds = nb_model.predict(X_test)
    nb_f1 = f1_score(y_test, nb_preds, average="macro")
    log.info(f"GaussianNaiveBayes — macro-F1: {nb_f1:.4f}")

    joblib.dump(nb_model, MODEL_DIR / "naive_bayes.pkl")
    log.info("Saved: naive_bayes.pkl")

    # ── Save scaler separately (used at inference time) ──────────
    joblib.dump(lr_pipe.named_steps["scaler"], MODEL_DIR / "scaler.pkl")

    # ── Save metadata ─────────────────────────────────────────────
    meta = {
        "lr_f1":  round(lr_f1, 4),
        "nb_f1":  round(nb_f1, 4),
        "classes": list(VERDICT_MAP.values()),
        "n_features": X.shape[1],
    }
    (MODEL_DIR / "basic_meta.json").write_text(json.dumps(meta, indent=2))
    log.info("Basic model training complete ✓")

# ── Train BERT (advanced) ─────────────────────────────────────────
def train_bert(df: pd.DataFrame):
    log.info("=== Training BERT model (distilbert-base-uncased) ===")
    try:
        import torch
        from transformers import (DistilBertTokenizerFast, DistilBertForSequenceClassification,
                                  TrainingArguments, Trainer)
        from datasets import Dataset
    except ImportError:
        log.error("torch/transformers not installed. Run: pip install torch transformers datasets")
        sys.exit(1)

    device = os.getenv("DEVICE", "cpu")
    log.info(f"Using device: {device}")

    NUM_LABELS = 5   # 0=safe, 1=phishing, 2=honeytrap, 3=scam, 4=malware

    tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")

    def tokenize(batch):
        return tokenizer(batch["url"], padding="max_length", truncation=True, max_length=128)

    train_df, val_df = train_test_split(df, test_size=0.15, random_state=42, stratify=df["label"])
    train_ds = Dataset.from_pandas(train_df[["url", "label"]].rename(columns={"label": "labels"}))
    val_ds   = Dataset.from_pandas(val_df[["url", "label"]].rename(columns={"label": "labels"}))

    train_ds = train_ds.map(tokenize, batched=True)
    val_ds   = val_ds.map(tokenize, batched=True)
    train_ds.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
    val_ds.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

    model = DistilBertForSequenceClassification.from_pretrained(
        "distilbert-base-uncased", num_labels=NUM_LABELS,
    )

    bert_dir = str(MODEL_DIR / "bert_finetuned")
    training_args = TrainingArguments(
        output_dir=bert_dir,
        num_train_epochs=3,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=32,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        warmup_steps=100,
        weight_decay=0.01,
        logging_dir="./logs",
        logging_steps=50,
        no_cuda=(device == "cpu"),
    )

    trainer = Trainer(model=model, args=training_args,
                      train_dataset=train_ds, eval_dataset=val_ds)

    log.info("Starting BERT fine-tuning…")
    trainer.train()
    trainer.save_model(bert_dir)
    tokenizer.save_pretrained(bert_dir)
    log.info(f"BERT model saved to {bert_dir} ✓")

# ── CLI ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=["basic", "advanced", "all"], default="basic")
    args = parser.parse_args()

    df = load_dataset()
    log.info(f"Dataset loaded: {len(df)} rows, label distribution:\n{df['label'].value_counts().to_string()}")

    if args.model in ("basic", "all"):
        train_basic(df)
    if args.model in ("advanced", "all"):
        train_bert(df)

    log.info("All requested models trained ✓")
