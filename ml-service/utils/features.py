"""
Feature extraction pipeline.
Extracts ~35 numerical features from a raw URL + optional metadata.
"""
import re
import math
import hashlib
from urllib.parse import urlparse, parse_qs
from typing import Optional
import tldextract
import numpy as np

# ── Homoglyph / lookalike brand patterns ─────────────────────────
BRAND_LOOKALIKES = [
    r"paypa[l1]", r"g[o0]{2}g[l1]e", r"micros[o0]ft", r"app[l1]e",
    r"faceb[o0]{2}k", r"amaz[o0]n", r"netf[l1]ix", r"inst[a@]gr[a@]m",
    r"[l1]inked[i1]n", r"tw[i1]tter", r"wh[a@]ts[a@]pp", r"te[l1]egr[a@]m",
]
BRAND_RE = [re.compile(p, re.IGNORECASE) for p in BRAND_LOOKALIKES]

# ── Suspicious keywords ───────────────────────────────────────────
SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "update", "confirm", "account",
    "banking", "password", "credential", "signin", "wallet",
    "free", "winner", "prize", "gift", "claim", "reward",
    "urgent", "alert", "suspended", "limited", "expire",
    "meet", "single", "date", "chat", "hot", "adult", "hookup",
    "casino", "bet", "betting", "poker", "slots", "gamble", "jackpot",
]

# ── High-risk TLDs ────────────────────────────────────────────────
RISKY_TLDS = {
    "tk", "ml", "ga", "cf", "gq",       # Freenom free TLDs — heavily abused
    "ru", "cn", "top", "xyz", "click",
    "pw", "cc", "biz", "info", "ws",
    "party", "date", "review", "download",
}

def _entropy(s: str) -> float:
    """Shannon entropy of a string."""
    if not s:
        return 0.0
    counts = {}
    for c in s:
        counts[c] = counts.get(c, 0) + 1
    total = len(s)
    return -sum((v / total) * math.log2(v / total) for v in counts.values())

def _digit_ratio(s: str) -> float:
    if not s:
        return 0.0
    return sum(c.isdigit() for c in s) / len(s)

def _special_char_count(s: str) -> int:
    return len(re.findall(r'[^a-zA-Z0-9]', s))

def extract_features(
    url: str,
    domain_age_days: Optional[int] = None,
    redirect_count:  int = 0,
) -> np.ndarray:
    """
    Returns a 1-D numpy array of shape (35,) with numerical features.
    Feature order is stable — do NOT change without retraining.
    """
    # ── Parse URL ─────────────────────────────────────────────────
    try:
        parsed = urlparse(url)
    except Exception:
        return np.zeros(35, dtype=np.float32)

    ext = tldextract.extract(url)
    domain    = ext.domain or ""
    subdomain = ext.subdomain or ""
    suffix    = ext.suffix or ""
    path      = parsed.path or ""
    query     = parsed.query or ""
    full_host = parsed.netloc or ""

    # ── Feature 0-7: URL-level lexical ───────────────────────────
    f0  = len(url)                                          # total URL length
    f1  = _entropy(url)                                     # URL entropy
    f2  = url.count("-")                                    # hyphen count
    f3  = url.count(".")                                    # dot count
    f4  = url.count("@")                                    # @ symbol (rare, suspicious)
    f5  = url.count("//") - 1                               # double-slash count
    f6  = int("https" in url.lower())                       # has HTTPS
    f7  = _special_char_count(url)                          # total special chars

    # ── Feature 8-14: Domain-level ────────────────────────────────
    f8  = len(domain)                                       # domain name length
    f9  = _entropy(domain)                                  # domain entropy
    f10 = _digit_ratio(domain)                              # digit ratio in domain
    f11 = len(subdomain.split(".")) if subdomain else 0     # subdomain depth
    f12 = int(suffix.split(".")[-1] in RISKY_TLDS)         # risky TLD flag
    f13 = int(bool(re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', full_host)))  # IP as host
    f14 = int(any(br.search(domain + subdomain) for br in BRAND_RE))               # brand lookalike

    # ── Feature 15-20: Path & query ───────────────────────────────
    f15 = len(path)                                         # path length
    f16 = path.count("/")                                   # path depth
    f17 = len(parse_qs(query))                              # number of query params
    f18 = _entropy(path)                                    # path entropy
    f19 = int(any(kw in url.lower() for kw in SUSPICIOUS_KEYWORDS))  # suspicious keyword hit
    f20 = sum(url.lower().count(kw) for kw in SUSPICIOUS_KEYWORDS)   # suspicious keyword count

    # ── Feature 21-27: Domain age & infra ─────────────────────────
    # Encode domain_age_days safely: unknown → -1 (model was trained with -1)
    raw_age = domain_age_days if domain_age_days is not None else -1
    f21 = raw_age                                           # raw age in days
    f22 = int(raw_age >= 0 and raw_age < 7)                 # brand-new domain (<7d)
    f23 = int(raw_age >= 0 and raw_age < 30)                # young domain (<30d)
    f24 = int(raw_age >= 0 and raw_age < 365)               # domain < 1 year old
    f25 = redirect_count                                    # redirect chain length
    f26 = int(redirect_count > 3)                           # many redirects flag
    f27 = len(full_host)                                    # full hostname length

    # ── Feature 28-34: Structural / misc ──────────────────────────
    f28 = int(len(url) > 75)                                # very long URL
    f29 = int(len(url) > 120)                               # extremely long URL
    f30 = int("%" in url)                                   # URL-encoded chars present
    f31 = url.count("%")                                    # percent encoding count
    f32 = int("=" in query and "pass" in url.lower())       # password in params
    f33 = int(domain.count("-") > 2)                        # many hyphens (dash stuffing)
    f34 = _entropy(domain + path)                           # combined domain+path entropy

    features = np.array([
        f0,  f1,  f2,  f3,  f4,  f5,  f6,  f7,
        f8,  f9,  f10, f11, f12, f13, f14,
        f15, f16, f17, f18, f19, f20,
        f21, f22, f23, f24, f25, f26, f27,
        f28, f29, f30, f31, f32, f33, f34,
    ], dtype=np.float32)

    return features

FEATURE_NAMES = [
    "url_length", "url_entropy", "hyphen_count", "dot_count",
    "at_count", "double_slash_count", "has_https", "special_char_count",
    "domain_length", "domain_entropy", "domain_digit_ratio", "subdomain_depth",
    "risky_tld", "ip_as_host", "brand_lookalike",
    "path_length", "path_depth", "query_param_count", "path_entropy",
    "suspicious_keyword_hit", "suspicious_keyword_count",
    "domain_age_days", "very_new_domain", "young_domain", "domain_lt_1yr",
    "redirect_count", "many_redirects", "hostname_length",
    "very_long_url", "extremely_long_url", "has_encoding", "encoding_count",
    "password_in_params", "many_hyphens", "domain_path_entropy",
]
