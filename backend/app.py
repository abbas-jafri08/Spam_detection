from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
from utils import transform_text

app = Flask(__name__)
CORS(app)

# Load model
model = pickle.load(open("model.pkl", "rb"))
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))

# History storage
history = []

def predict_spam(message):
    # ✅ Preprocess
    message = transform_text(message)

    vec = vectorizer.transform([message])

    prediction = int(model.predict(vec)[0])
    probabilities = model.predict_proba(vec)[0]

    # ✅ Correct confidence
    confidence = float(probabilities[prediction]) * 100

    label = "SPAM" if prediction == 1 else "HAM"

    return label, round(confidence, 2)


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    message = data.get("message", "")

    if not message:
        return jsonify({"error": "Empty message"}), 400

    label, confidence = predict_spam(message)

    # Save history
    history.insert(0, {
        "text": message,
        "label": label
    })

    if len(history) > 10:
        history.pop()

    return jsonify({
        "prediction": label,
        "confidence": confidence,
        "history": history
    })


@app.route("/history", methods=["GET"])
def get_history():
    return jsonify(history)


if __name__ == "__main__":
    app.run(debug=True)