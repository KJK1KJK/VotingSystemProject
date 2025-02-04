import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { saveAs } from "file-saver";
import { useNavigate, useParams } from "react-router-dom";

Chart.register(ArcElement, Tooltip, Legend);

const API_BASE_URL = "http://127.0.0.1:8000/api"; 

const PollResults = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [results, setResults] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const navigate = useNavigate();
  const { sessionId } = useParams(); 

  useEffect(() => {
    fetchPollResults();
  }, []);

  
  const fetchPollResults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/votes/session/${sessionId}/results`);

      if (!response.ok) {
        if (response.status === 404) {
          alert("No votes found for this poll.");
        } else {
          alert("Failed to fetch poll results. Please try again later.");
        }
        navigate("/");
        return;
      }

      const votesData = await response.json();
      processVotes(votesData);
    } catch (error) {
      console.error("Error fetching results:", error);
      alert("A network error occurred. Please check your connection.");
    }
  };


  const processVotes = (votes) => {
    const voteCounts = {};
    let total = 0;

    votes.forEach((vote) => {
      const candidateName = vote.candidate.name;
      voteCounts[candidateName] = (voteCounts[candidateName] || 0) + 1;
      total++;
    });

    setResults(voteCounts);
    setTotalVotes(total);
  };

  const generateChartData = (data) => {
    return {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: ["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#9C27B0"],
          hoverBackgroundColor: ["#357AE8", "#CC3333", "#E8A500", "#2A8E46", "#7A1FA2"],
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const count = context.raw || 0;
            const percentage = totalVotes ? ((count / totalVotes) * 100).toFixed(2) : 0;
            return `${label}: ${count} votes (${percentage}%)`;
          },
        },
      },
    },
  };

  const exportResults = (type) => {
    let fileData;
    if (type === "csv") {
      const csvContent = ["Candidate,Votes", ...Object.entries(results).map(([name, count]) => `${name},${count}`)].join("\n");
      fileData = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    } else {
      fileData = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    }
    saveAs(fileData, `poll_results.${type}`);
    setShowDropdown(false);
  };

  return (
    <div style={styles.container}>
      <h1>Poll Results</h1>
      <button onClick={() => navigate("/")} style={styles.backButton}>
        Back to Poll
      </button>
      <div style={styles.exportContainer}>
        <button onClick={() => setShowDropdown(!showDropdown)} style={styles.exportButton}>
          Export
        </button>
        {showDropdown && (
          <div style={styles.dropdownMenu}>
            <button onClick={() => exportResults("csv")}>Export as CSV</button>
            <button onClick={() => exportResults("json")}>Export as JSON</button>
          </div>
        )}
      </div>

      {/* Pie Chart */}
      <div style={styles.chartsContainer}>
        {Object.keys(results).length > 0 ? (
          <div style={styles.chartWrapper}>
            <h3>Vote Distribution</h3>
            <Pie data={generateChartData(results)} options={chartOptions} />
            <p>Total Votes: {totalVotes}</p>
          </div>
        ) : (
          <p>No votes recorded yet.</p>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
  },
  backButton: {
    padding: "10px 15px",
    marginBottom: "20px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  exportContainer: {
    position: "relative",
    display: "inline-block",
  },
  exportButton: {
    padding: "10px 15px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: "0",
    backgroundColor: "#fff",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    borderRadius: "5px",
    overflow: "hidden",
    zIndex: 1,
  },
  chartsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "20px",
  },
  chartWrapper: {
    width: "350px",
    textAlign: "center",
  },
};

export default PollResults;
