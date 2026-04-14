import re
import string

def transform_text(text: str) -> str:
    t = text.lower()
    t = re.sub(r'http\S+|www\.\S+', ' ', t)
    t = re.sub(r'\d+', ' ', t)
    t = t.translate(str.maketrans('', '', string.punctuation))
    t = re.sub(r'\s+', ' ', t).strip()
    return t