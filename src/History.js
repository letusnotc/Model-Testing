import React, { useState } from 'react';

export default function History({ attempts, onBack }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [localAttempts, setLocalAttempts] = useState(attempts);

  const toggleExpand = (index) => {
    if (expandedIndex === index) {
      setExpandedIndex(null); // Collapse if clicking again
    } else {
      setExpandedIndex(index); // Expand clicked user
    }
  };

  const removeEntry = (index) => {
    const updatedAttempts = [...localAttempts];
    updatedAttempts.splice(index, 1);
    setLocalAttempts(updatedAttempts);
    
    // Update localStorage to persist changes
    localStorage.setItem('attempts', JSON.stringify(updatedAttempts));
    
    // If currently expanded entry is deleted, collapse the view
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  // Get average scores for each user
  const getAverageScores = (results) => {
    if (!results || results.length === 0) return { cosine: 0, editDistance: 0 };
    
    const total = results.reduce((acc, result) => {
      return {
        cosine: acc.cosine + result.cosine,
        editDistance: acc.editDistance + result.editDistance
      };
    }, { cosine: 0, editDistance: 0 });
    
    return {
      cosine: total.cosine / results.length,
      editDistance: total.editDistance / results.length
    };
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Test History</h2>
        <button onClick={onBack} className="back-button">Back to Test</button>
      </div>

      {localAttempts.length === 0 ? (
        <div className="no-attempts">No test history available</div>
      ) : (
        <div className="attempts-list">
          {localAttempts.map((attempt, index) => {
            const averageScores = getAverageScores(attempt.results);
            
            return (
              <div 
                key={index} 
                className={`attempt-item ${expandedIndex === index ? 'expanded' : ''}`}
              >
                <div className="attempt-header" onClick={() => toggleExpand(index)}>
                  <div className="attempt-basic-info">
                    <div className="attempt-name">{attempt.name}</div>
                    <div className="attempt-date">{new Date(attempt.timestamp).toLocaleDateString()}</div>
                  </div>
                  <div className="attempt-summary">
                    <span className="score-label">Avg Similarity: </span>
                    <span className="score-value">{averageScores.cosine.toFixed(1)}%</span>
                  </div>
                  <div className="expand-indicator">
                    {expandedIndex === index ? '▼' : '▶'}
                  </div>
                </div>
                
                {expandedIndex === index && (
                  <div className="attempt-details">
                    <div className="user-details">
                      <p><strong>Name:</strong> {attempt.name}</p>
                      <p><strong>Ethnicity:</strong> {attempt.ethnicity}</p>
                      <p><strong>Date:</strong> {new Date(attempt.timestamp).toLocaleString()}</p>
                    </div>
                    
                    <div className="results-tabs">
                      <div className="language-tabs">
                        <div className="lang-tab">English</div>
                        <div className="lang-tab">Hinglish</div>
                      </div>
                      
                      <div className="results-grid">
                        {attempt.results.map((result, idx) => (
                          <div key={idx} className="result-item">
                            <div className="result-language">{result.language.charAt(0).toUpperCase() + result.language.slice(1)} #{result.sentenceIndex + 1}</div>
                            <div className="result-scores">
                              <div className="score">
                                <span className="score-label">Similarity:</span> 
                                <span className="score-value">{result.cosine.toFixed(1)}%</span>
                              </div>
                              <div className="score">
                                <span className="score-label">Edit Distance:</span> 
                                <span className="score-value">{result.editDistance.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="attempt-actions">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEntry(index);
                        }}
                        className="delete-button"
                      >
                        Delete Entry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <style jsx>{`
        .history-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .back-button {
          padding: 0.5rem 1rem;
          background-color: #f0f0f0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .back-button:hover {
          background-color: #e0e0e0;
        }
        
        .no-attempts {
          text-align: center;
          padding: 2rem;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        
        .attempts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .attempt-item {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .attempt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background-color: #f5f5f5;
          cursor: pointer;
        }
        
        .attempt-item.expanded .attempt-header {
          border-bottom: 1px solid #e0e0e0;
        }
        
        .attempt-basic-info {
          display: flex;
          flex-direction: column;
        }
        
        .attempt-name {
          font-weight: 600;
          font-size: 1rem;
        }
        
        .attempt-date {
          font-size: 0.8rem;
          color: #666;
        }
        
        .attempt-summary {
          font-size: 0.9rem;
        }
        
        .expand-indicator {
          font-size: 0.8rem;
        }
        
        .attempt-details {
          padding: 1rem;
          background-color: #ffffff;
        }
        
        .user-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }
        
        .user-details p {
          margin: 0;
        }
        
        .results-tabs {
          margin-top: 1rem;
        }
        
        .language-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .lang-tab {
          padding: 0.25rem 1rem;
          background-color: #f0f0f0;
          border-radius: 4px 4px 0 0;
          font-size: 0.9rem;
          cursor: pointer;
        }
        
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }
        
        .result-item {
          padding: 0.75rem;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        
        .result-language {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        
        .result-scores {
          font-size: 0.85rem;
        }
        
        .score {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        
        .score-label {
          color: #666;
        }
        
        .score-value {
          font-weight: 500;
        }
        
        .attempt-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }
        
        .delete-button {
          padding: 0.5rem 1rem;
          background-color: #ffeeee;
          color: #e33;
          border: 1px solid #ffcccc;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .delete-button:hover {
          background-color: #ffdddd;
        }
      `}</style>
    </div>
  );
}