import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PredictionForm from '../components/PredictionForm';
import SyncService from '../utils/SyncService';
import LoginTesting from '../utils/LoginTesting';
import '../styles/Predictions.css';

const Predictions = () => {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [userPredictions, setUserPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Инициализация компонента
    initComponent();
  }, []);

  // Инициализация компонента
  const initComponent = async () => {
    // Проверка авторизации
    const isAuth = await LoginTesting.checkAuth();
    setIsLoggedIn(isAuth);
    
    // Загружаем данные
    loadData(isAuth);
  };

  // Загрузка всех необходимых данных
  const loadData = async (isAuthenticated) => {
    try {
      setLoading(true);
      
      // Загрузка матчей
      const matches = await SyncService.fetchMatches();
      setUpcomingMatches(matches);
      
      // Если пользователь авторизован, загружаем его прогнозы
      if (isAuthenticated) {
        const predictions = await SyncService.fetchUserPredictions();
        setUserPredictions(predictions);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Ошибка загрузки данных: ' + err.message);
      setLoading(false);
    }
  };

  // Синхронизация данных с сервером
  const syncData = async () => {
    if (!isLoggedIn) {
      alert('Для синхронизации необходимо войти в систему');
      return;
    }
    
    try {
      setIsSyncing(true);
      setSyncStatus({ message: 'Проверка соединения...' });
      
      // Проверяем соединение
      const isConnected = await SyncService.checkConnection();
      
      if (!isConnected) {
        setSyncStatus({ 
          success: false, 
          message: 'Нет соединения с сервером. Синхронизация невозможна.' 
        });
        return;
      }
      
      setSyncStatus({ message: 'Синхронизация данных...' });
      
      // Запускаем синхронизацию
      const result = await SyncService.autoSync();
      
      setSyncStatus({ 
        success: result.success, 
        message: result.success 
          ? `Синхронизировано ${result.predictions.syncedCount} прогнозов` 
          : 'Ошибка синхронизации: ' + result.message
      });
      
      // Перезагружаем прогнозы
      const predictions = await SyncService.fetchUserPredictions();
      setUserPredictions(predictions);
    } catch (error) {
      setSyncStatus({ 
        success: false, 
        message: 'Ошибка синхронизации: ' + error.message 
      });
    } finally {
      setIsSyncing(false);
      
      // Автоматически скрываем статус через 5 секунд
      setTimeout(() => {
        setSyncStatus(null);
      }, 5000);
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
      // Используем SyncService для отправки прогноза
      const result = await SyncService.submitPrediction(
        matchId, 
        homeScore, 
        awayScore, 
        comment
      );
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Обновляем локальное состояние
      setUserPredictions(prev => ({
        ...prev,
        [matchId]: result.data
      }));
      
      // Показываем сообщение
      alert(result.isLocal 
        ? 'Прогноз сохранен локально и будет отправлен на сервер при следующей синхронизации.' 
        : 'Ваш прогноз успешно сохранен!'
      );
      
      return result.data;
    } catch (err) {
      console.error('Ошибка при сохранении прогноза:', err);
      alert(`Не удалось сохранить прогноз: ${err.message || 'Неизвестная ошибка'}`);
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
        <div className="predictions-header">
          <div>
            <h1>Болжамдар</h1>
            <p className="subtitle">Келесі матчтарға өз болжамыңызды жасаңыз</p>
          </div>
        </div>
        
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
                      isOfflineMode={userPredictions[match.id]?.is_local_only}
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