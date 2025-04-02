import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Matches.css'; // Используем тот же CSS что и для прошедших матчей

const UpcomingMatches = () => {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Загрузка предстоящих матчей с API
    const fetchUpcomingMatches = async () => {
      try {
        setLoading(true);
        // Запрос к API для получения предстоящих матчей
        const response = await fetch('http://localhost:5000/api/matches/upcoming-matches');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setUpcomingMatches(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchUpcomingMatches();
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
  
  // Вычисление времени до матча
  const getTimeUntilMatch = (matchDate) => {
    const now = new Date();
    const match = new Date(matchDate);
    const diffTime = match - now;
    
    if (diffTime <= 0) return 'Скоро начнется';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} күн ${diffHours} сағат қалды`;
    } else {
      return `${diffHours} сағат қалды`;
    }
  };

  return (
    <div className="matches-page">
      <Header />
      
      <div className="matches-container">
        <h1>Келесі матчтар</h1>
        <p className="subtitle">Лига Чемпионаты 2024/2025 алдағы матчтары</p>
        
        {loading ? (
          <div className="loading">Жүктеу...</div>
        ) : error ? (
          <div className="error">Қате: {error}</div>
        ) : (
          <div className="matches-list">
            {upcomingMatches.length === 0 ? (
              <div className="no-matches">Алдағы матчтар табылмады</div>
            ) : (
              upcomingMatches.map((match) => (
                <div key={match.id} className="match-item">
                  <div className="match-date">{formatDate(match.match_date)}</div>
                  <div className="time-until">{getTimeUntilMatch(match.match_date)}</div>
                  <div className="match-stage">{match.stage || 'Лига Чемпионаты'}</div>
                  
                  <div className="match-card">
                    <div className="team home-team">
                      <span className="team-name">{match.home_team}</span>
                    </div>
                    
                    <div className="match-info">
                      <span className="versus1">VS</span>
                    </div>
                    
                    <div className="team away-team">
                      <span className="team-name">{match.away_team}</span>
                    </div>
                    <div className="match-info">
                    <Link 
                        to={`/predictions?match=${match.id}`} 
                        className="predict-button"
                      >
                        Болжам жасау
                      </Link>
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

export default UpcomingMatches;