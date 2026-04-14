import React, { useState, useEffect } from "react";
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
  const [recentMessages, setRecentMessages] = useState([]);

  // 🔥 CHANGE THIS TO YOUR REAL BACKEND URL
  const API_URL = "https://YOUR-RENDER-BACKEND.onrender.com";

  const handlePredict = async () => {
    if (!inputMessage.trim()) return;

    try {
      const res = await axios.post(`${API_URL}/predict`, {
        message: inputMessage,
      });

      const label = res.data.prediction.toUpperCase();
      const conf = res.data.confidence;

      setPrediction(label);
      setConfidence(conf);

      // update stats
      setStats((prev) => {
        const updated = { ...prev, total: prev.total + 1 };

        if (label === "SPAM") updated.spam += 1;
        else updated.ham += 1;

        return updated;
      });

      // store locally (since backend has no history)
      setRecentMessages((prev) => [
        { text: inputMessage, label },
        ...prev,
      ]);

      setInputMessage("");

    } catch (err) {
      console.error("Axios Error:", err);
    }
  };

  const pieData = {
    labels: ["Spam", "Ham"],
    datasets: [
      {
        data: [
          recentMessages.filter(m => m.label === "SPAM").length,
          recentMessages.filter(m => m.label === "HAM").length
        ],
        backgroundColor: ["#e74c3c", "#2ecc71"],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="app-container">

      <div className="sidebar">
        <h3>Quick Stats</h3>

        <div className="stat-box">
          <span>Total</span>
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

        <Pie data={pieData} />

        <h3>Model Info</h3>
        <p>Naive Bayes + TF-IDF</p>
      </div>

      <div className="main">
        <div className="card">
          <h3>Input Message</h3>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button onClick={handlePredict}>Predict</button>
        </div>

        <div className="card">
          <h3>Recent Messages</h3>

          {recentMessages.length === 0 ? (
            <p>No messages yet</p>
          ) : (
            recentMessages.map((msg, i) => (
              <div key={i} className="recent-msg">
                <span>{msg.text}</span>
                <span className={`tag ${msg.label.toLowerCase()}`}>
                  {msg.label}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="right">
        {prediction && (
          <div className="card">
            <h3>Prediction</h3>

            <div className={`result-tag ${prediction.toLowerCase()}`}>
              {prediction}
            </div>

            <p>Confidence: {Number(confidence).toFixed(2)}%</p>

            <div className="progress">
              <div
                className={`progress-fill ${prediction.toLowerCase()}`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default App;