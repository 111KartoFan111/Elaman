import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PredictionForm from '../components/PredictionForm';
import '../styles/Predictions.css';

const Predictions = () => {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [userPredictions, setUserPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверка авторизации пользователя
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
      fetchUserPredictions();
    }

    // Загрузка предстоящих матчей
    fetchUpcomingMatches();
  }, []);

  // Получение предстоящих матчей
  const fetchUpcomingMatches = async () => {
    try {
      setLoading(true);
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

  // Получение прогнозов пользователя
  const fetchUserPredictions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5000/api/predictions/predictions?match_status=upcoming', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Если токен истек, разлогиниваем пользователя
          localStorage.removeItem('access_token');
          setIsLoggedIn(false);
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Преобразуем массив прогнозов в объект для удобного доступа по match_id
      const predictionsMap = {};
      data.forEach(prediction => {
        predictionsMap[prediction.match_id] = prediction;
      });
      
      setUserPredictions(predictionsMap);
    } catch (err) {
      console.error('Error fetching user predictions:', err);
    }
  };

// Обработка отправки прогноза
const handlePredictionSubmit = async (matchId, homeScore, awayScore, comment) => {
  if (!isLoggedIn) {
    alert('Пожалуйста, войдите в систему, чтобы делать прогнозы');
    navigate('/login');
    return;
  }

  try {
    const token = localStorage.getItem('access_token');
    const existingPrediction = userPredictions[matchId];

    let url;
    let method;

    if (existingPrediction) {
      url = `http://localhost:5000/api/predictions/${existingPrediction.id}`;
      method = 'PUT';
    } else {
      url = `http://localhost:5000/api/predictions/${matchId}`;
      method = 'POST';
    }

    const requestData = {
      home_score: parseInt(homeScore),
      away_score: parseInt(awayScore),
      comment: comment || '',
    };

    console.log(`Отправка ${method} запроса на ${url} с данными:`, requestData);

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.msg || errorData.error || errorText;
      } catch (e) {
        errorMessage = errorText;
      }

      console.error(`Ошибка ${response.status}: ${errorMessage}`);
      throw new Error(`Ошибка сервера: ${response.status}. ${errorMessage}`);
    }

    const responseData = await response.json().catch(() => ({}));
    console.log('Успешный ответ:', responseData);

    await fetchUserPredictions();
    alert('Ваш прогноз сохранен!');

    return responseData;
  } catch (err) {
    console.error('Полная ошибка:', err);
    const errorMessage = err.message || err.error || 'Неизвестная ошибка';
    alert(`Не удалось сохранить прогноз: ${errorMessage}`);
    throw err;
  }
};
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

  // Время до начала матча
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
    <div className="predictions-page">
      <Header />
      
      <div className="predictions-container">
        <h1>Болжамдар</h1>
        <p className="subtitle">Келесі матчтарға өз болжамыңызды жасаңыз</p>
        
        {!isLoggedIn && (
          <div className="login-prompt">
            <p>Болжам жасау үшін, алдымен аккаунтқа кіріңіз</p>
            <button onClick={() => navigate('/login')} className="login-button">Кіру</button>
          </div>
        )}
        
        {loading ? (
          <div className="loading">Жүктеу...</div>
        ) : error ? (
          <div className="error">Қате: {error}</div>
        ) : (
          <div className="upcoming-matches-list">
            {upcomingMatches.length === 0 ? (
              <div className="no-matches">Алдағы матчтар жоқ</div>
            ) : (
              upcomingMatches.map((match) => (
                <div key={match.id} className="match-prediction-item">
                  <div className="match-info">
                    <div className="match-date">{formatDate(match.match_date)}</div>
                    <div className="time-until">{getTimeUntilMatch(match.match_date)}</div>
                    <div className="match-stage">{match.stage || 'Лига Чемпионаты'}</div>
                    
                    <div className="match-teams">
                      <div className="team home-team">
                        <span className="team-name">{match.home_team}</span>
                      </div>
                      
                      <div className="versus">VS</div>
                      
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
                  
                  <div className="prediction-section">
                    <h3>Сіздің болжамыңыз</h3>
                    <PredictionForm 
                      matchId={match.id}
                      homeTeam={match.home_team}
                      awayTeam={match.away_team}
                      existingPrediction={userPredictions[match.id]}
                      isLoggedIn={isLoggedIn}
                      onSubmit={handlePredictionSubmit}
                    />
                  </div>
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

export default Predictions;