"""
clean_dataset.py
----------------
Cleans the raw collected dataset:
  - Normalises domains to lowercase
  - Removes duplicates
  - Removes invalid domains (empty, too short, non-ASCII)
  - Removes domains that appear in both benign and malicious sets
  - Outputs clean_dataset.csv
"""

import os
import re
import pandas as pd

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INPUT_FILE = os.path.join(BASE_DIR, "backend", "dataset", "raw_dataset.csv")
OUTPUT_FILE = os.path.join(BASE_DIR, "backend", "dataset", "clean_dataset.csv")

DOMAIN_RE = re.compile(
    r"^(?!-)[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?"
    r"(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*"
    r"\.[a-z]{2,}$"
)


def is_valid_domain(domain: str) -> bool:
    """Return True if domain looks syntactically valid."""
    if not isinstance(domain, str):
        return False
    if len(domain) < 3 or len(domain) > 253:
        return False
    try:
        domain.encode("ascii")
    except UnicodeEncodeError:
        return False
    return bool(DOMAIN_RE.match(domain))


def main() -> None:
    print(f"[+] Loading {INPUT_FILE}")
    df = pd.read_csv(INPUT_FILE)
    initial = len(df)
    print(f"    Rows loaded: {initial}")

    # Normalise
    df["domain"] = df["domain"].astype(str).str.strip().str.lower()

    # Remove duplicates (keep first)
    df.drop_duplicates(subset=["domain"], keep="first", inplace=True)
    print(f"    After dedup: {len(df)} (removed {initial - len(df)})")

    # Validate domains
    valid_mask = df["domain"].apply(is_valid_domain)
    removed_invalid = (~valid_mask).sum()
    df = df[valid_mask]
    print(f"    After validation: {len(df)} (removed {removed_invalid} invalid)")

    # Remove overlapping domains (same domain labelled both 0 and 1)
    overlap_domains = (
        df.groupby("domain")["label"]
        .nunique()
        .loc[lambda x: x > 1]
        .index
    )
    if len(overlap_domains):
        df = df[~df["domain"].isin(overlap_domains)]
        print(f"    Removed {len(overlap_domains)} overlapping domains")

    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"\n[✓] Saved {len(df)} clean rows → {OUTPUT_FILE}")
    print(f"    Benign : {(df['label'] == 0).sum()}")
    print(f"    Malicious: {(df['label'] == 1).sum()}")


if __name__ == "__main__":
    main()
