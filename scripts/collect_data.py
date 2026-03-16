"""
collect_data.py
---------------
Collects domain data from local dataset files and merges them into a unified
raw dataset with binary labels (0 = benign, 1 = malicious).

Sources used (from the local dataset/ folder):
  - Tranco Top 1M                        → benign
  - DGA Domains Dataset                  → malicious
  - Benign & Malicious DNS Logs          → both
  - Combined Multiclass (train + test)   → both
"""

import os
import sys
import pandas as pd

# ---------------------------------------------------------------------------
# Paths – relative to the project root (malicious-domain-detector/)
# ---------------------------------------------------------------------------
DATASET_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "dataset")
)
OUTPUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "backend", "dataset")
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "raw_dataset.csv")

TRANCO_PATH = os.path.join(DATASET_ROOT, "tranco_6GY4X.csv")
DGA_FULL_PATH = os.path.join(
    DATASET_ROOT,
    "DGA_domains_dataset-master",
    "DGA_domains_dataset-master",
    "dga_domains_full.csv",
)
DNS_BENIGN_MAL_PATH = os.path.join(
    DATASET_ROOT,
    "Benign and malicious domains based on DNS logs",
    "Benign and malicious domains based on DNS logs",
    "BenignAndMaliciousDataset.csv",
)
TRAIN_MULTI_PATH = os.path.join(
    DATASET_ROOT,
    "train_combined_multiclass.csv",
    "train_combined_multiclass.csv",
)
TEST_MULTI_PATH = os.path.join(
    DATASET_ROOT,
    "test_combined_multiclass.csv",
    "test_combined_multiclass.csv",
)

TARGET_BENIGN = 100_000
TARGET_MALICIOUS = 100_000


def load_tranco(path: str, n: int = TARGET_BENIGN) -> pd.DataFrame:
    """Load the Tranco Top-1M list and return benign domains."""
    print(f"[+] Loading Tranco list from {path}")
    df = pd.read_csv(path, header=None, names=["rank", "domain"])
    df = df[["domain"]].dropna().head(n)
    df["label"] = 0
    df["source"] = "tranco"
    print(f"    → {len(df)} benign domains loaded")
    return df


def load_dga(path: str, n: int = TARGET_MALICIOUS) -> pd.DataFrame:
    """Load DGA domains (malicious)."""
    print(f"[+] Loading DGA domains from {path}")
    df = pd.read_csv(path, header=None, names=["class", "family", "domain"])
    mal = df[df["class"] == "dga"][["domain"]].dropna().head(n)
    mal["label"] = 1
    mal["source"] = "dgarchive"
    print(f"    → {len(mal)} malicious DGA domains loaded")
    return mal


def load_multiclass(train_path: str, test_path: str) -> pd.DataFrame:
    """Load combined multiclass train + test sets."""
    frames = []
    for tag, p in [("train", train_path), ("test", test_path)]:
        if os.path.isfile(p):
            print(f"[+] Loading multiclass {tag} from {p}")
            df = pd.read_csv(p)
            # Expect columns: domain, class (0/1)
            if "domain" in df.columns and "class" in df.columns:
                df = df.rename(columns={"class": "label"})
                df["label"] = df["label"].astype(int).clip(0, 1)
                df["source"] = f"multiclass_{tag}"
                frames.append(df[["domain", "label", "source"]])
                print(f"    → {len(df)} domains loaded")
    if frames:
        return pd.concat(frames, ignore_index=True)
    return pd.DataFrame(columns=["domain", "label", "source"])


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    parts: list[pd.DataFrame] = []

    # 1. Tranco (benign)
    if os.path.isfile(TRANCO_PATH):
        parts.append(load_tranco(TRANCO_PATH))

    # 2. DGA (malicious)
    if os.path.isfile(DGA_FULL_PATH):
        parts.append(load_dga(DGA_FULL_PATH))

    # 3. Multiclass train/test
    parts.append(load_multiclass(TRAIN_MULTI_PATH, TEST_MULTI_PATH))

    if not parts:
        print("[!] No data sources found. Check dataset paths.")
        sys.exit(1)

    combined = pd.concat(parts, ignore_index=True)
    print(f"\n[*] Total combined rows: {len(combined)}")
    print(f"    Benign : {(combined['label'] == 0).sum()}")
    print(f"    Malicious: {(combined['label'] == 1).sum()}")

    # Balance the dataset
    benign = combined[combined["label"] == 0].head(TARGET_BENIGN)
    malicious = combined[combined["label"] == 1].head(TARGET_MALICIOUS)
    balanced = pd.concat([benign, malicious], ignore_index=True)
    balanced = balanced.sample(frac=1, random_state=42).reset_index(drop=True)

    balanced.to_csv(OUTPUT_FILE, index=False)
    print(f"\n[✓] Saved {len(balanced)} rows → {OUTPUT_FILE}")
    print(f"    Benign : {(balanced['label'] == 0).sum()}")
    print(f"    Malicious: {(balanced['label'] == 1).sum()}")


if __name__ == "__main__":
    main()
