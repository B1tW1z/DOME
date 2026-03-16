"""
features/extractor.py
---------------------
Reusable feature extraction module used by both the training scripts
and the FastAPI prediction service.
"""

import math
import string
from collections import Counter
import numpy as np

VOWELS = set("aeiou")
CONSONANTS = set(string.ascii_lowercase) - VOWELS

TLD_RISK = {
    "com": 0.1, "net": 0.15, "org": 0.1, "info": 0.5, "biz": 0.6,
    "xyz": 0.8, "top": 0.85, "club": 0.7, "online": 0.75, "site": 0.7,
    "ru": 0.6, "cn": 0.55, "tk": 0.9, "ml": 0.9, "ga": 0.9, "cf": 0.9,
    "gq": 0.9, "work": 0.7, "click": 0.75, "link": 0.6, "pw": 0.85,
    "buzz": 0.7, "win": 0.8, "review": 0.75, "stream": 0.7,
    "download": 0.8, "racing": 0.75, "loan": 0.8, "trade": 0.7,
    "edu": 0.05, "gov": 0.05, "mil": 0.05,
}

FEATURE_NAMES = [
    "domain_length", "name_length", "num_digits", "num_hyphens", "num_dots",
    "vowel_ratio", "consonant_ratio", "entropy",
    "bigram_uniqueness", "trigram_uniqueness", "char_dist_std",
    "tld_risk_score", "has_ip_pattern", "subdomain_count",
    "digit_ratio", "special_char_count",
    "blacklist_score", "phishing_report_count",
]


def shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    freq = Counter(s)
    length = len(s)
    return -sum((c / length) * math.log2(c / length) for c in freq.values())


def vowel_ratio(domain: str) -> float:
    alpha = [c for c in domain if c.isalpha()]
    return sum(1 for c in alpha if c in VOWELS) / max(len(alpha), 1)


def consonant_ratio(domain: str) -> float:
    alpha = [c for c in domain if c.isalpha()]
    return sum(1 for c in alpha if c in CONSONANTS) / max(len(alpha), 1)


def ngram_uniqueness(domain: str, n: int = 2) -> float:
    ngrams = [domain[i : i + n] for i in range(len(domain) - n + 1)]
    return len(set(ngrams)) / max(len(ngrams), 1)


def char_distribution_std(domain: str) -> float:
    if not domain:
        return 0.0
    freq = Counter(domain)
    counts = np.array(list(freq.values()), dtype=float)
    return float(np.std(counts))


def tld_risk_score(domain: str) -> float:
    tld = domain.rsplit(".", 1)[-1] if "." in domain else ""
    return TLD_RISK.get(tld, 0.3)


def extract_features(domain: str) -> dict:
    """Extract all features for a single domain string."""
    domain = domain.strip().lower()
    name = domain.rsplit(".", 1)[0] if "." in domain else domain

    return {
        "domain_length": len(domain),
        "name_length": len(name),
        "num_digits": sum(c.isdigit() for c in name),
        "num_hyphens": name.count("-"),
        "num_dots": domain.count("."),
        "vowel_ratio": round(vowel_ratio(name), 4),
        "consonant_ratio": round(consonant_ratio(name), 4),
        "entropy": round(shannon_entropy(name), 4),
        "bigram_uniqueness": round(ngram_uniqueness(name, 2), 4),
        "trigram_uniqueness": round(ngram_uniqueness(name, 3), 4),
        "char_dist_std": round(char_distribution_std(name), 4),
        "tld_risk_score": tld_risk_score(domain),
        "has_ip_pattern": 1 if sum(1 for p in domain.split(".") if p.isdigit()) >= 3 else 0,
        "subdomain_count": max(0, domain.count(".") - 1),
        "digit_ratio": round(sum(c.isdigit() for c in name) / max(len(name), 1), 4),
        "special_char_count": sum(
            1 for c in name if c not in string.ascii_lowercase and not c.isdigit() and c != "-"
        ),
        "blacklist_score": 0.0,
        "phishing_report_count": 0,
    }


def features_to_array(features: dict) -> np.ndarray:
    """Convert feature dict to numpy array in the expected column order."""
    return np.array([features[col] for col in FEATURE_NAMES], dtype=np.float32)


def encode_domain_chars(domain: str, maxlen: int = 128) -> np.ndarray:
    """Encode a single domain as integer sequence for the LSTM."""
    encoded = np.zeros(maxlen, dtype=np.int32)
    for j, ch in enumerate(domain[:maxlen]):
        encoded[j] = min(ord(ch), 127)
    return encoded
