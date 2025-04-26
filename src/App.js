import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import cosineSimilarity from 'compute-cosine-similarity';

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
    resetTranscript();
    setSimilarityScore(null);
    setEditDistance(null);
    setEditDistancePercentage(null);
    if (currentSentenceIndex < sentences[currentLanguage].length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    } else {
      setCurrentSentenceIndex(0);
      setCurrentLanguage(currentLanguage === 'english' ? 'hinglish' : 'english');
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <div className="card">Your browser doesn't support speech recognition.</div>;
  }

  return (
    <div className="App">
      <h1>Speech Recognition Test</h1>
      
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
    </div>
  );
}

export default App; 