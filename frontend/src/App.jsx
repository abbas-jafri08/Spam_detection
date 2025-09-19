import React, { useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import "./App.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const App = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [stats, setStats] = useState({ total: 0, spam: 0, ham: 0 });

  const handlePredict = async () => {
    try {
      // 🔹 Use your Render backend URL
      const res = await axios.post("https://spam-detection-cgk5.onrender.com/predict", {
        message: inputMessage,
      });

      setPrediction(res.data.prediction); // spam | ham
      setConfidence((res.data.confidence * 100).toFixed(2));

      // Update stats
      setStats((prev) => {
        const updated = { ...prev, total: prev.total + 1 };
        if (res.data.prediction === "spam") updated.spam += 1;
        else updated.ham += 1;
        return updated;
      });

    } catch (err) {
      console.error(err);
      alert("Error connecting to backend.");
    }
  };

  const pieData = {
    labels: ["Spam", "Ham"],
    datasets: [
      {
        data: [stats.spam, stats.ham],
        backgroundColor: ["#e74c3c", "#2ecc71"],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const recentMessages = [
    { text: "Congrats! You won...", label: "Spam" },
    { text: "Meeting at 3pm...", label: "Ham" },
    { text: "Verify your account...", label: "Spam" }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h3>Quick Stats</h3>
        <div className="stat-box">
          <span>Total Analyzed</span>
          <b>{stats.total}</b>
        </div>
        <div className="stat-box">
          <span>Spam %</span>
          <b>{stats.total ? ((stats.spam / stats.total) * 100).toFixed(1) : 0}%</b>
        </div>
        <div className="stat-box">
          <span>Ham %</span>
          <b>{stats.total ? ((stats.ham / stats.total) * 100).toFixed(1) : 0}%</b>
        </div>

        <div className="pie-wrapper">
          <Pie data={pieData} />
        </div>

        <h3>Model Info</h3>
        <p><b>Algorithm:</b> Naive Bayes</p>
        <p><b>Vectorizer:</b> TF-IDF</p>
        <p><b>Dataset:</b> SMS Spam Collection</p>
      </div>

      {/* Main Content */}
      <div className="main">
        <div className="card">
          <h3>Input Message</h3>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type or paste your SMS/email here..."
          />
          <button onClick={handlePredict}>Predict</button>
        </div>

        <div className="card">
          <h3>Recent Messages</h3>
          {recentMessages.map((msg, i) => (
            <div className="recent-msg" key={i}>
              <span>{msg.text}</span>
              <span className={`tag ${msg.label.toLowerCase()}`}>
                {msg.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column */}
      <div className="right">
        {prediction && (
          <div className="card">
            <h3>Prediction Result</h3>
            <div className={`result-tag ${prediction}`}>
              {prediction.toUpperCase()}
            </div>
            <p>Confidence: {confidence}%</p>
            <div className="progress">
              <div
                className={`progress-fill ${prediction}`}
                style={{ width: `${confidence}%` }}
              ></div>
            </div>
            <p>
              {prediction === "ham"
                ? "This message appears legitimate."
                : "This message contains characteristics of spam."}
            </p>
          </div>
        )}

        <div className="card">
          <h3>Last Flagged</h3>
          <div className="result-tag spam">SPAM</div>
          <p>Confidence: 92%</p>
          <div className="progress">
            <div className="progress-fill spam" style={{ width: "92%" }}></div>
          </div>
          <p>Claim your prize now! Limited time offer. Click the link to verify and receive your reward.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
