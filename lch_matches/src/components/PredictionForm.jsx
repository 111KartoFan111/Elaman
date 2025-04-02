import React, { useState, useEffect } from 'react';
import '../styles/PredictionForm.css';

const PredictionForm = ({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  existingPrediction, 
  isLoggedIn, 
  onSubmit,
  isOfflineMode = false 
}) => {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Если есть существующий прогноз, заполняем форму его данными
    if (existingPrediction) {
      setHomeScore(existingPrediction.home_score.toString());
      setAwayScore(existingPrediction.away_score.toString());
      setComment(existingPrediction.comment || '');
      setIsEditing(false);
    } else {
      // Если прогноза нет, сбрасываем форму
      resetForm();
      setIsEditing(true);
    }
  }, [existingPrediction]);

  const resetForm = () => {
    setHomeScore('');
    setAwayScore('');
    setComment('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Предотвращаем двойную отправку
    if (isSubmitting) return;
    
    // Валидация
    if (homeScore === '' || awayScore === '') {
      alert('Пожалуйста, введите счет матча');
      return;
    }
    
    // Проверяем, что введены корректные числа
    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);
    
    if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) {
      alert('Пожалуйста, введите корректные числа для счета');
      return;
    }
    
    if (homeScoreNum < 0 || awayScoreNum < 0) {
      alert('Счет не может быть отрицательным');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Передаем значения в родительский компонент
      await onSubmit(matchId, homeScore, awayScore, comment);
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка при отправке прогноза:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="prediction-form-container not-logged-in">
        <p>Для создания прогноза необходимо войти в систему</p>
      </div>
    );
  }

  return (
    <div className="prediction-form-container">
      {existingPrediction && !isEditing ? (
        <div className={`existing-prediction ${isOfflineMode ? 'offline-mode' : ''}`}>
          <div className="prediction-score">
            <span className="team-short">{homeTeam.substring(0, 3).toUpperCase()}</span>
            <span className="score">{existingPrediction.home_score} - {existingPrediction.away_score}</span>
            <span className="team-short">{awayTeam.substring(0, 3).toUpperCase()}</span>
          </div>
          
          {existingPrediction.comment && (
            <div className="prediction-comment">
              <p>"{existingPrediction.comment}"</p>
            </div>
          )}
          
          {isOfflineMode && (
            <div className="offline-indicator">
              <span>Деректер сақталды</span>
            </div>
          )}
          
          <button 
            className="edit-prediction-btn"
            onClick={() => setIsEditing(true)}
          >
            Өзгерту
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="prediction-form">
          <div className="score-inputs">
            <div className="team-score">
              <label>{homeTeam}</label>
              <input className='auth-input'
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            
            <div className="score-separator">-</div>
            
            <div className="team-score">
              <label>{awayTeam}</label>
              <input className='auth-input'
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>
          
          <div className="comment-input">
            <label>Пікір (міндетті емес):</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Матч туралы пікіріңізді қалдырыңыз..."
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            {existingPrediction && (
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                Бас тарту
              </button>
            )}
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Сақталуда...' 
                : existingPrediction 
                  ? 'Сақтау' 
                  : 'Болжам жасау'
              }
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PredictionForm;