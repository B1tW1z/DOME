"""
train_model.py
--------------
Trains two models for malicious domain detection:

  Model 1  – Bi-directional LSTM (PyTorch)
  Model 2  – Random Forest (Scikit-learn)
  Model 3  – XGBoost (optional, if installed)

Produces:
  - Saved model files in backend/models/
  - Evaluation metrics JSON
  - Confusion matrix + ROC curve images
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import joblib
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
)

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FEATURES_FILE = os.path.join(BASE_DIR, "backend", "dataset", "features_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "backend", "models")

FEATURE_COLS = [
    "domain_length", "name_length", "num_digits", "num_hyphens", "num_dots",
    "vowel_ratio", "consonant_ratio", "entropy",
    "bigram_uniqueness", "trigram_uniqueness", "char_dist_std",
    "tld_risk_score", "has_ip_pattern", "subdomain_count",
    "digit_ratio", "special_char_count"
]

MAX_DOMAIN_LEN = 128
CHAR_VOCAB_SIZE = 128
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ========================  UTILITIES  ======================================

def encode_domains_char(domains: pd.Series, maxlen: int = MAX_DOMAIN_LEN) -> np.ndarray:
    """Encode domain strings as integer sequences for the LSTM."""
    encoded = np.zeros((len(domains), maxlen), dtype=np.int64)
    for i, domain in enumerate(domains):
        for j, ch in enumerate(str(domain)[:maxlen]):
            encoded[i, j] = min(ord(ch), CHAR_VOCAB_SIZE - 1)
    return encoded


def save_confusion_matrix(y_true, y_pred, path: str, title: str = "Confusion Matrix"):
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(5, 4))
    ax.imshow(cm, cmap="Greys")
    for i in range(2):
        for j in range(2):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                    color="white" if cm[i, j] > cm.max() / 2 else "black", fontsize=14)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(["Benign", "Malicious"])
    ax.set_yticklabels(["Benign", "Malicious"])
    ax.set_title(title)
    fig.tight_layout()
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"    Saved confusion matrix -> {path}")


def save_roc_curve(y_true, y_proba, path: str, title: str = "ROC Curve"):
    fpr, tpr, _ = roc_curve(y_true, y_proba)
    auc = roc_auc_score(y_true, y_proba)
    fig, ax = plt.subplots(figsize=(5, 4))
    ax.plot(fpr, tpr, color="white", lw=2, label=f"AUC = {auc:.4f}")
    ax.plot([0, 1], [0, 1], "--", color="#555", lw=1)
    ax.set_facecolor("#0B0B0B")
    fig.patch.set_facecolor("#0B0B0B")
    ax.set_xlabel("False Positive Rate", color="white")
    ax.set_ylabel("True Positive Rate", color="white")
    ax.set_title(title, color="white")
    ax.tick_params(colors="white")
    ax.legend(facecolor="#141414", edgecolor="#2A2A2A", labelcolor="white")
    for spine in ax.spines.values():
        spine.set_color("#2A2A2A")
    fig.tight_layout()
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="#0B0B0B")
    plt.close(fig)
    print(f"    Saved ROC curve -> {path}")


def evaluate(y_true, y_pred, y_proba) -> dict:
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred)), 4),
        "recall": round(float(recall_score(y_true, y_pred)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, y_proba)), 4),
    }


# ========================  PyTorch LSTM  ===================================

class BiLSTMClassifier(nn.Module):
    def __init__(self, vocab_size=CHAR_VOCAB_SIZE, embed_dim=64,
                 hidden_dim=64, num_layers=1):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=num_layers,
                            batch_first=True, bidirectional=True)
        self.dropout = nn.Dropout(0.3)
        self.fc1 = nn.Linear(hidden_dim * 2, 64)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(64, 1)

    def forward(self, x):
        x = self.embedding(x)
        _, (h_n, _) = self.lstm(x)
        # Concatenate forward and backward hidden states
        h = torch.cat((h_n[-2], h_n[-1]), dim=1)
        h = self.dropout(h)
        h = self.relu(self.fc1(h))
        h = self.dropout(h)
        return self.fc2(h).squeeze(1)


def train_lstm(X_char_train, y_train, X_char_test, y_test):
    print("\n" + "=" * 60)
    print("  MODEL 1 - Bidirectional LSTM (PyTorch)")
    print("=" * 60)

    # Prepare data loaders
    train_ds = TensorDataset(
        torch.LongTensor(X_char_train),
        torch.FloatTensor(y_train),
    )
    test_ds = TensorDataset(
        torch.LongTensor(X_char_test),
        torch.FloatTensor(y_test),
    )
    train_loader = DataLoader(train_ds, batch_size=256, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=256)

    model = BiLSTMClassifier().to(DEVICE)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    print(f"  Device: {DEVICE}")
    print(f"  Parameters: {sum(p.numel() for p in model.parameters()):,}")

    # Training loop
    for epoch in range(5):
        model.train()
        total_loss = 0
        correct = 0
        total = 0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(DEVICE), batch_y.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * len(batch_y)
            preds = (torch.sigmoid(outputs) >= 0.5).float()
            correct += (preds == batch_y).sum().item()
            total += len(batch_y)

        avg_loss = total_loss / total
        acc = correct / total
        print(f"  Epoch {epoch+1}/5  loss={avg_loss:.4f}  acc={acc:.4f}")

    # Evaluation
    model.eval()
    all_proba = []
    with torch.no_grad():
        for batch_x, _ in test_loader:
            batch_x = batch_x.to(DEVICE)
            outputs = model(batch_x)
            proba = torch.sigmoid(outputs).cpu().numpy()
            all_proba.append(proba)

    y_proba = np.concatenate(all_proba)
    y_pred = (y_proba >= 0.5).astype(int)
    metrics = evaluate(y_test, y_pred, y_proba)
    print(f"\n  LSTM Metrics: {json.dumps(metrics, indent=2)}")

    # Save model
    torch.save(model.state_dict(), os.path.join(MODELS_DIR, "lstm_model.pt"))

    save_confusion_matrix(
        y_test, y_pred,
        os.path.join(MODELS_DIR, "lstm_confusion_matrix.png"),
        "LSTM Confusion Matrix",
    )
    save_roc_curve(
        y_test, y_proba,
        os.path.join(MODELS_DIR, "lstm_roc_curve.png"),
        "LSTM ROC Curve",
    )
    return metrics


# ========================  RANDOM FOREST  ==================================

def train_random_forest(X_train, y_train, X_test, y_test):
    print("\n" + "=" * 60)
    print("  MODEL 2 - Random Forest")
    print("=" * 60)
    clf = RandomForestClassifier(n_estimators=200, max_depth=20,
                                 random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]
    metrics = evaluate(y_test, y_pred, y_proba)
    print(f"\n  Random Forest Metrics: {json.dumps(metrics, indent=2)}")

    joblib.dump(clf, os.path.join(MODELS_DIR, "random_forest.joblib"))
    save_confusion_matrix(
        y_test, y_pred,
        os.path.join(MODELS_DIR, "rf_confusion_matrix.png"),
        "Random Forest Confusion Matrix",
    )
    save_roc_curve(
        y_test, y_proba,
        os.path.join(MODELS_DIR, "rf_roc_curve.png"),
        "Random Forest ROC Curve",
    )
    return metrics


# ========================  XGBOOST  =======================================

def train_xgboost(X_train, y_train, X_test, y_test):
    print("\n" + "=" * 60)
    print("  MODEL 3 - XGBoost")
    print("=" * 60)
    try:
        from xgboost import XGBClassifier
    except ImportError:
        print("  [!] XGBoost not installed - skipping.")
        return None

    clf = XGBClassifier(
        n_estimators=200, max_depth=8, learning_rate=0.1,
        use_label_encoder=False, eval_metric="logloss",
        random_state=42, n_jobs=-1,
    )
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]
    metrics = evaluate(y_test, y_pred, y_proba)
    print(f"\n  XGBoost Metrics: {json.dumps(metrics, indent=2)}")

    joblib.dump(clf, os.path.join(MODELS_DIR, "xgboost.joblib"))
    save_confusion_matrix(
        y_test, y_pred,
        os.path.join(MODELS_DIR, "xgb_confusion_matrix.png"),
        "XGBoost Confusion Matrix",
    )
    save_roc_curve(
        y_test, y_proba,
        os.path.join(MODELS_DIR, "xgb_roc_curve.png"),
        "XGBoost ROC Curve",
    )
    return metrics


# ========================  MAIN  ==========================================

def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    print(f"[+] Loading features from {FEATURES_FILE}")
    df = pd.read_csv(FEATURES_FILE)
    print(f"    Rows: {len(df)}   Features: {len(FEATURE_COLS)}")

    X_feat = df[FEATURE_COLS].values.astype(np.float32)
    y = df["label"].values.astype(np.int32)

    # Scale features for ML models
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_feat)
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))

    # Train / test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    # Character-level encoding for LSTM
    domains = df["domain"]
    X_char = encode_domains_char(domains)
    X_char_train, X_char_test, _, _ = train_test_split(
        X_char, y, test_size=0.2, random_state=42, stratify=y
    )

    all_metrics = {}

    # 1. PyTorch LSTM
    all_metrics["lstm"] = train_lstm(X_char_train, y_train, X_char_test, y_test)

    # 2. Random Forest
    all_metrics["random_forest"] = train_random_forest(X_train, y_train, X_test, y_test)

    # 3. XGBoost (optional)
    xgb_metrics = train_xgboost(X_train, y_train, X_test, y_test)
    if xgb_metrics:
        all_metrics["xgboost"] = xgb_metrics

    # Save all metrics
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"\n[+] All metrics saved -> {metrics_path}")

    # Save feature column list for API
    with open(os.path.join(MODELS_DIR, "feature_columns.json"), "w") as f:
        json.dump(FEATURE_COLS, f)

    print("\n[DONE] Training complete!")


if __name__ == "__main__":
    main()
