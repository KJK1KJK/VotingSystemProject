import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';

Chart.register(ArcElement, Tooltip, Legend);

const PollResults = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [responses, setResponses] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const storedResponses = JSON.parse(localStorage.getItem('pollResponses'));
    if (storedResponses) {
      setResponses(storedResponses);
    } else {
      alert('No poll responses found. Redirecting to the polls page.');
      navigate('/');
    }
  }, [navigate]);

  const generateChartData = (data) => {
    return {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9C27B0'],
          hoverBackgroundColor: ['#357AE8', '#CC3333', '#E8A500', '#2A8E46', '#7A1FA2'],
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  const exportResults = (type) => {
    let fileData;
    if (type === 'csv') {
      const csvContent = [
        'Category,Value',
        ...Object.entries(responses).flatMap(([question, answers]) =>
          Object.entries(answers).map(([option, count]) => `${question} - ${option},${count}`)
        ),
      ].join('\n');
      fileData = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } else {
      fileData = new Blob([JSON.stringify(responses, null, 2)], { type: 'application/json' });
    }
    saveAs(fileData, `poll_results.${type}`);
    setShowDropdown(false);
  };

  return (
    <div style={styles.container}>
      <h1>Poll Results</h1>
      <button onClick={() => navigate('/')} style={styles.backButton}>Back to Poll</button>
      <div style={styles.exportContainer}>
        <button onClick={() => setShowDropdown(!showDropdown)} style={styles.exportButton}>Export</button>
        {showDropdown && (
          <div style={styles.dropdownMenu}>
            <button onClick={() => exportResults('csv')}>Export as CSV</button>
            <button onClick={() => exportResults('json')}>Export as JSON</button>
          </div>
        )}
      </div>

      <div style={styles.chartsContainer}>
        {Object.entries(responses).map(([question, data], index) => (
          <div key={index} style={styles.chartWrapper}>
            <h3>{question}</h3>
            <Pie data={generateChartData(data)} options={chartOptions} />
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  backButton: {
    padding: '10px 15px',
    marginBottom: '20px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  exportContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  exportButton: {
    padding: '10px 15px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: '0',
    backgroundColor: '#fff',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    borderRadius: '5px',
    overflow: 'hidden',
    zIndex: 1,
  },
  chartsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '20px',
  },
  chartWrapper: {
    width: '350px',
    textAlign: 'center',
  },
};

export default PollResults;
