import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score
from utils import transform_text

print("🚀 Loading dataset...")

# Load dataset
df = pd.read_csv("spam.csv", encoding="latin-1")[["v1", "v2"]]
df.columns = ["label", "message"]

# Convert labels
df["label"] = df["label"].map({"ham": 0, "spam": 1})

# ✅ Apply preprocessing
df["message"] = df["message"].apply(transform_text)

# Split
X_train, X_test, y_train, y_test = train_test_split(
    df["message"], df["label"], test_size=0.2, random_state=42
)

print("✅ Data split done")

# Vectorizer
vectorizer = TfidfVectorizer(stop_words="english", max_features=3000)

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

print("✅ Vectorization done")

# Model
model = MultinomialNB()
model.fit(X_train_vec, y_train)

print("✅ Model trained")

# Accuracy
y_pred = model.predict(X_test_vec)
accuracy = accuracy_score(y_test, y_pred)
print(f"🎯 Accuracy: {accuracy}")

# Save
pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))

print("💾 Model saved successfully!")