# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import time
from collections import deque
import os

# load model & vectorizer (place model.pkl & vectorizer.pkl in the same folder)
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
VECT_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")

with open(VECT_PATH, "rb") as f:
    tfidf = pickle.load(f)

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

app = Flask(__name__)
CORS(app)

# In-memory stats/history
STATS = {
    "total_analyzed": 0,
    "spam_count": 0,
    "ham_count": 0,
}
RECENT = deque(maxlen=10)
LAST_FLAGGED = None

def predict_label_and_confidence(text):
    """Return (label, confidence_percent). Label is 'spam' or 'ham'."""
    vec = tfidf.transform([text])
    # get prediction
    pred = model.predict(vec)[0]
    # obtain probabilities if available
    prob_arr = None
    if hasattr(model, "predict_proba"):
        prob_arr = model.predict_proba(vec)[0]

    # Try to determine label format (some models use 0/1, others 'ham'/'spam')
    if isinstance(pred, (str,)):
        label = pred.lower()
    else:
        # numeric mapping: find which class corresponds to spam if classes_ exist
        if hasattr(model, "classes_"):
            classes = list(model.classes_)
            # guess spam/ham strings or 0/1 numeric
            if "spam" in classes and "ham" in classes:
                # classes e.g. ['ham','spam']
                label = "spam" if pred == "spam" or (pred == 1 and classes.index("spam") == 1) else "ham"
            else:
                # treat 1 as spam, 0 as ham
                label = "spam" if int(pred) == 1 else "ham"
        else:
            label = "spam" if int(pred) == 1 else "ham"

    # Confidence
    confidence = 0.0
    if prob_arr is not None:
        # if classes_ exist, find index for 'spam' or 'ham'
        if hasattr(model, "classes_"):
            classes = list(model.classes_)
            try:
                if "spam" in classes:
                    idx = classes.index("spam")
                    confidence = float(prob_arr[idx]) * 100.0
                elif "ham" in classes:
                    idx = classes.index("ham")
                    # if predicted ham, confidence = prob[ham] else 100 - prob[ham]
                    confidence = float(prob_arr[classes.index(label)]) * 100.0
                else:
                    # fallback: take max prob
                    confidence = float(max(prob_arr)) * 100.0
            except Exception:
                confidence = float(max(prob_arr)) * 100.0
        else:
            confidence = float(max(prob_arr)) * 100.0
    else:
        # no predict_proba - fallback
        confidence = 50.0

    return label, round(confidence, 2)


@app.route("/", methods=["GET"])
def index():
    return jsonify({"status": "ok", "message": "Spam Detector API"})


@app.route("/predict", methods=["POST"])
def predict():
    global LAST_FLAGGED
    data = request.get_json(silent=True) or {}
    msg = data.get("message", "")
    if not msg or not msg.strip():
        return jsonify({"error": "message is required"}), 400

    label, confidence = predict_label_and_confidence(msg)

    STATS["total_analyzed"] += 1
    if label == "spam":
        STATS["spam_count"] += 1
        LAST_FLAGGED = {"message": msg, "confidence": confidence, "ts": int(time.time()*1000)}
    else:
        STATS["ham_count"] += 1

    item = {"message": msg[:2000], "label": label, "confidence": confidence, "ts": int(time.time()*1000)}
    RECENT.appendleft(item)

    return jsonify({"prediction": label, "confidence": confidence})


@app.route("/stats", methods=["GET"])
def stats():
    total = STATS["total_analyzed"]
    spam_pct = (STATS["spam_count"] / total * 100.0) if total else 0.0
    ham_pct = (STATS["ham_count"] / total * 100.0) if total else 0.0
    return jsonify({
        "totalAnalyzed": total,
        "spamCount": STATS["spam_count"],
        "hamCount": STATS["ham_count"],
        "spamPct": round(spam_pct, 2),
        "hamPct": round(ham_pct, 2),
    })


@app.route("/recent", methods=["GET"])
def recent():
    return jsonify(list(RECENT))


@app.route("/last-flagged", methods=["GET"])
def last_flagged():
    return jsonify(LAST_FLAGGED if LAST_FLAGGED else None)


if __name__ == "__main__":
    # run on 0.0.0.0 if you want access from other devices; default 127.0.0.1 is fine
    app.run(host="127.0.0.1", port=5000, debug=True)
