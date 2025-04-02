import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Leaderboard.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Загрузка таблицы лидеров
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        // Запрос к API для получения таблицы лидеров
        const response = await fetch('http://localhost:5000/api/predictions/leaderboard');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        // Сортировка данных по рангу, если это не сделано на бэкенде
        const sortedData = data.sort((a, b) => a.rank - b.rank);
        setLeaderboard(sortedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  // Функция для определения класса на основе позиции
  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-first';
    if (rank === 2) return 'rank-second';
    if (rank === 3) return 'rank-third';
    return '';
  };

  return (
    <div className="leaderboard-page">
      <Header />
      
      <div className="leaderboard-container">
        <h1>Көш бастаушылар</h1>
        <p className="subtitle">Болжамдар бойынша ең жоғары ұпайлары бар пайдаланушылар</p>
        
        {loading ? (
          <div className="loading">Жүктеу...</div>
        ) : error ? (
          <div className="error">Қате: {error}</div>
        ) : (
          <div className="leaderboard-table-container">
            {leaderboard.length === 0 ? (
              <div className="no-data">Әзірге болжамдар жоқ</div>
            ) : (
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th className="rank-column">Орын</th>
                    <th className="user-column">Пайдаланушы</th>
                    <th className="points-column">Ұпайлар</th>
                    <th className="predictions-column">Болжамдар</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item) => (
                    <tr 
                      key={item.user_id || Math.random()} 
                      className={getRankClass(item.rank)}
                    >
                      <td className="rank-column">
                        <div className="rank">{item.rank}</div>
                      </td>
                      <td className="user-column">
                        <div className="username">{item.username}</div>
                      </td>
                      <td className="points-column">
                        <div className="points">{item.total_points}</div>
                      </td>
                      <td className="predictions-column">
                        <div className="predictions-count">{item.predictions_count}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        
        <div className="leaderboard-info">
          <h3>Болжам жүйесі туралы</h3>
          <ul>
            <li><strong>3 ұпай</strong> - нақты есеп</li>
            <li><strong>1 ұпай</strong> - дұрыс нәтиже (жеңіс/тең/жеңіліс)</li>
            <li><strong>0 ұпай</strong> - қате болжам</li>
          </ul>
          <p>Өз болжамыңызды жасап, көшбасшылар кестесіне енуге тырысыңыз!</p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Leaderboard;