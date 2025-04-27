import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import cosineSimilarity from 'compute-cosine-similarity';
import UserForm from './UserForm';
import History from './History';

// Levenshtein distance implementation
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1, // substitution
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1      // insertion
        );
      }
    }
  }
  return dp[m][n];
}

function App() {
  const [hasRegistered, setHasRegistered] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [attempts, setAttempts] = useState(() => {
    const saved = localStorage.getItem('attempts');
    return saved ? JSON.parse(saved) : [];
  });
  const [viewMode, setViewMode] = useState('test');
  const [currentResults, setCurrentResults] = useState([]);
  const [sentences, setSentences] = useState({
    english: [
      "The quick brown fox jumps over the lazy dog",
      "She sells seashells by the seashore",
      "How much wood would a woodchuck chuck",
      "Peter Piper picked a peck of pickled peppers",
      "I scream, you scream, we all scream for ice cream"
    ],
    hinglish: [
      "Mera naam John hai aur main Delhi se hoon",
      "Aaj main office jaa raha hoon",
      "Mere paas ek car hai jo bahut fast hai",
      "Main kal shopping mall gaya tha",
      "Mera favorite food pizza hai"
    ]
  });
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [similarityScore, setSimilarityScore] = useState(null);
  const [editDistance, setEditDistance] = useState(null);
  const [editDistancePercentage, setEditDistancePercentage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      calculateSimilarity(transcript);
    }
  }, [transcript]);

  const calculateSimilarity = (spokenText) => {
    const targetText = sentences[currentLanguage][currentSentenceIndex];
    
    // Convert both texts to lowercase for comparison
    const spokenTextLower = spokenText.toLowerCase();
    const targetTextLower = targetText.toLowerCase();
    
    // Calculate cosine similarity
    const spokenWords = spokenTextLower.split(' ');
    const targetWords = targetTextLower.split(' ');
    
    const allWords = [...new Set([...spokenWords, ...targetWords])];
    const spokenVector = allWords.map(word => spokenWords.filter(w => w === word).length);
    const targetVector = allWords.map(word => targetWords.filter(w => w === word).length);
    
    const similarity = cosineSimilarity(spokenVector, targetVector);
    setSimilarityScore(similarity);

    // Calculate Levenshtein distance
    const distance = levenshteinDistance(spokenTextLower, targetTextLower);
    setEditDistance(distance);
    
    // Calculate edit distance percentage (lower is better)
    const maxLength = Math.max(spokenTextLower.length, targetTextLower.length);
    const percentage = (distance / maxLength) * 100;
    setEditDistancePercentage(percentage);
  };

  const startListening = () => {
    SpeechRecognition.startListening();
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const nextSentence = () => {
    // Save current result
    const currentResult = {
      language: currentLanguage,
      sentenceIndex: currentSentenceIndex,
      cosine: similarityScore * 100,
      editDistance: editDistancePercentage
    };
    
    const updatedResults = [...currentResults, currentResult];
    setCurrentResults(updatedResults);
    
    // Check if we're at the last sentence of current language
    if (currentSentenceIndex < sentences[currentLanguage].length - 1) {
      // Move to next sentence in current language
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    } else {
      // We've finished all sentences in current language
      
      // Check if we've completed both languages
      if (currentLanguage === 'hinglish') {
        // We've completed both languages - save the full attempt
        const newAttempt = {
          ...currentUser,
          timestamp: new Date().toISOString(),
          results: updatedResults
        };
        
        const updatedAttempts = [newAttempt, ...attempts];
        setAttempts(updatedAttempts);
        localStorage.setItem('attempts', JSON.stringify(updatedAttempts));
        
        // Show completion message or switch to history view
        setTestCompleted(true);
        
        // Reset for a new test
        setTimeout(() => {
          setCurrentSentenceIndex(0);
          setCurrentLanguage('english');
          setCurrentResults([]);
          setTestCompleted(false);
        }, 3000); // Show completion message for 3 seconds
      } else {
        // Switch from english to hinglish
        setCurrentLanguage('hinglish');
        setCurrentSentenceIndex(0);
      }
    }
    
    // Reset recording state
    resetTranscript();
    setSimilarityScore(null);
    setEditDistance(null);
    setEditDistancePercentage(null);
  };

  const startNewTest = () => {
    setCurrentSentenceIndex(0);
    setCurrentLanguage('english');
    setCurrentResults([]);
    setTestCompleted(false);
    resetTranscript();
  };

  const handleRegistration = (userData) => {
    setCurrentUser(userData);
    setHasRegistered(true);
  };

  if (!browserSupportsSpeechRecognition) {
    return <div className="card">Your browser doesn't support speech recognition.</div>;
  }

  return (
    <div className="App">
      <h1>Speech Recognition Test</h1>
      
      {hasRegistered ? (
        <>
          <div className="user-info">
            <p>User: {currentUser?.name || 'Anonymous'}</p>
            <button 
              onClick={() => setViewMode(viewMode === 'test' ? 'history' : 'test')}
              className="history-toggle"
            >
              {viewMode === 'test' ? 'View History' : 'Back to Test'}
            </button>
          </div>

          {viewMode === 'test' ? (
            <>
              {testCompleted ? (
                <div className="card">
                  <h2>Test Completed!</h2>
                  <p>You have finished all sentences in both languages.</p>
                  <button onClick={startNewTest}>Start New Test</button>
                </div>
              ) : (
                <div className="card">
                  <div className="language-indicator">
                    {currentLanguage.toUpperCase()}
                  </div>
                  <h2>Sentence {currentSentenceIndex + 1} of {sentences[currentLanguage].length}</h2>
                  <div className="sentence-display">
                    {sentences[currentLanguage][currentSentenceIndex]}
                  </div>
          
                  <div className="button-group">
                    <button 
                      onClick={startListening} 
                      disabled={listening}
                    >
                      {listening && <span className="recording-indicator" />}
                      {listening ? 'Recording...' : 'Start Recording'}
                    </button>
                    <button 
                      onClick={stopListening} 
                      disabled={!listening}
                    >
                      Stop Recording
                    </button>
                    <button 
                      onClick={nextSentence}
                    >
                      Next Sentence
                    </button>
                  </div>
          
                  {transcript && (
                    <div className="transcript-display">
                      <h3>Your Speech:</h3>
                      <p>{transcript}</p>
                    </div>
                  )}
          
                  {similarityScore !== null && (
                    <div className="metrics-container">
                      <div className="metric-card">
                        <div className="metric-label">Cosine Similarity</div>
                        <div className="metric-value">{(similarityScore * 100).toFixed(2)}%</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-label">Edit Distance</div>
                        <div className="metric-value">{editDistance}</div>
                        <div className="metric-label">characters</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-label">Edit Distance %</div>
                        <div className="metric-value">{editDistancePercentage.toFixed(2)}%</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
        
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Edit Sentences</h3>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    {isEditing ? 'Done Editing' : 'Edit Sentences'}
                  </button>
                </div>
                
                {isEditing && sentences[currentLanguage].map((sentence, index) => (
                  <div key={index} style={{ marginBottom: '1rem' }}>
                    <input
                      type="text"
                      value={sentence}
                      onChange={(e) => {
                        const newSentences = { ...sentences };
                        newSentences[currentLanguage][index] = e.target.value;
                        setSentences(newSentences);
                      }}
                      placeholder={`Sentence ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <History 
              attempts={attempts} 
              onBack={() => setViewMode('test')}
            />
          )}
        </>
      ) : (
        <div className="card registration-card">
          <h2>Register to Start Test</h2>
          <UserForm onSubmit={handleRegistration} />
        </div>
      )}
    </div>
  );
}

export default App;