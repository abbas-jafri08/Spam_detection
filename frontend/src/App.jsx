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

  const API_URL = "https://your-backend-name.onrender.com";

  const handlePredict = async () => {
    if (!inputMessage.trim()) return;

    try {
      const res = await axios.post(`${API_URL}/predict`, {
        message: inputMessage,
      });

      setPrediction(res.data.prediction);
      setConfidence(res.data.confidence); // ✅ FIXED

      // Update stats
      setStats((prev) => {
        const updated = { ...prev, total: prev.total + 1 };

        if (res.data.prediction.toLowerCase() === "spam") {
          updated.spam += 1;
        } else {
          updated.ham += 1;
        }

        return updated;
      });

      setRecentMessages(res.data.history);

      setInputMessage(""); // ✅ clears input

    } catch (err) {
      console.error(err);
    }
  };

  // Load history on start
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/history`);
        setRecentMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistory();
  }, []);

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

      {/* Sidebar */}
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
        <p>Multinomial Naive Bayes + TF-IDF</p> {/* ✅ FIXED */}
      </div>

      {/* Main */}
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

      {/* Right */}
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
              ></div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default App;