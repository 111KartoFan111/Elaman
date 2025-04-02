import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Matches.css';

const Matches = () => {
  const [pastMatches, setPastMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Загрузка прошедших матчей с API
    const fetchPastMatches = async () => {
      try {
        setLoading(true);
        // Запрос к API для получения прошедших матчей
        const response = await fetch('http://localhost:5000/api/matches/past-matches');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setPastMatches(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchPastMatches();
  }, []);

  // Преобразование даты в удобный формат
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('kk-KZ', options);
  };

  return (
    <div className="matches-page">
      <Header />
      
      <div className="matches-container">
        <h1>Өткен матчтар</h1>
        <p className="subtitle">Лига Чемпионаты 2024/2025 нәтижелері</p>
        
        {loading ? (
          <div className="loading">Жүктеу...</div>
        ) : error ? (
          <div className="error">Қате: {error}</div>
        ) : (
          <div className="matches-list">
            {pastMatches.length === 0 ? (
              <div className="no-matches">Өткен матчтар табылмады</div>
            ) : (
              pastMatches.map((match) => (
                <div key={match.id} className="match-item">
                  <div className="match-date">{formatDate(match.match_date)}</div>
                  <div className="match-stage">{match.stage || 'Лига Чемпионаты'}</div>
                  
                  <div className="match-card">
                    <div className="team home-team">
                      <span className="team-name">{match.home_team}</span>
                    </div>
                    
                    <div className="match-score">
                      <span className="score">{match.home_score} - {match.away_score}</span>
                      <span className="status">Матч аяқталды</span>
                    </div>
                    
                    <div className="team away-team">
                      <span className="team-name">{match.away_team}</span>
                    </div>
                  </div>
                  
                  {match.stadium && (
                    <div className="match-stadium">
                      <span className="stadium-name">{match.stadium}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Matches;