# backend/utils.py
import re
import string

def transform_text(text: str) -> str:
    """Lightweight normalization (lowercase, remove urls, punctuation)."""
    t = text.lower()
    # remove URLs
    t = re.sub(r'http\S+|www\.\S+', ' ', t)
    # remove digits
    t = re.sub(r'\d+', ' ', t)
    # remove punctuation
    t = t.translate(str.maketrans('', '', string.punctuation))
    # collapse whitespace
    t = re.sub(r'\s+', ' ', t).strip()
    return t
