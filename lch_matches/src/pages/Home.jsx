import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Home.css';

const Home = () => {
  const [latestMatches, setLatestMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Получаем последние прошедшие матчи
        const pastResponse = await fetch('http://localhost:5000/api/matches/past-matches');
        const pastData = await pastResponse.json();
        
        // Получаем ближайшие матчи
        const upcomingResponse = await fetch('http://localhost:5000/api/matches/upcoming-matches');
        const upcomingData = await upcomingResponse.json();
        
        // Берем только последние 3 матча из каждой категории
        setLatestMatches(pastData.slice(0, 3));
        setUpcomingMatches(upcomingData.slice(0, 3));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Форматирование даты
  const formatDate = (dateString) => {
    const options = { 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('kk-KZ', options);
  };

  return (
    <div className="home-page">
      <Header />
      
      <div className="hero-section">
        <div className="hero-content">
          <h1>UEFA Чемпиондар Лигасы 2024/2025</h1>
          <p>Еуропаның ең беделді клубтық турнирінің матчтары, нәтижелері және болжамдары</p>
        </div>
      </div>
      
      <div className="main-container">
        <section className="featured-section">
          <div className="section-header">
            <h2>Соңғы матч нәтижелері</h2>
            <Link to="/matches" className="btn btn-primary">Барлығын көру</Link>
          </div>
          
          <div className="matches-grid">
            {loading ? (
              <div className="loading">Жүктеу...</div>
            ) : (
              latestMatches.map(match => (
                <div key={match.id} className="match-card">
                  <div className="match-header">
                    <span className="match-date">{formatDate(match.match_date)}</span>
                    <span className="match-stage">{match.stage || 'Лига Чемпионаты'}</span>
                  </div>
                  
                  <div className="match-content">
                    <div className="team home">{match.home_team}</div>
                    <div className="score-container">
                      <div className="score">{match.home_score} - {match.away_score}</div>
                      <div className="match-status">Матч аяқталды</div>
                    </div>
                    <div className="team away">{match.away_team}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        
        <section className="featured-section">
          <div className="section-header">
            <h2>Алдағы матчтар</h2>
            <Link to="/upcoming" className="btn btn-primary">Барлығын көру</Link>
          </div>
          
          <div className="matches-grid">
            {loading ? (
              <div className="loading">Жүктеу...</div>
            ) : (
              upcomingMatches.map(match => (
                <div key={match.id} className="match-card upcoming">
                  <div className="match-header">
                    <span className="match-date">{formatDate(match.match_date)}</span>
                    <span className="match-stage">{match.stage || 'Лига Чемпионаты'}</span>
                  </div>
                  
                  <div className="match-content">
                    <div className="team home">{match.home_team}</div>
                    <div className="score-container">
                      <div className="versus">VS</div>
                      <div className="match-time">
                        {new Date(match.match_date).toLocaleTimeString('kk-KZ', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="team away">{match.away_team}</div>
                  </div>
                  
                  <div className="match-actions">
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        
        <section className="cta-section">
          <div className="cta-content">
            <h2>Өз болжамыңызды жасаңыз!</h2>
            <p>Тіркеліңіз және болжамдар жасап, басқа пайдаланушылармен жарысыңыз</p>
            <div className="cta-buttons">
              <Link to="/predictions" className="btn btn-primary">Болжамдар жасау</Link>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
  );
};

export default Home;