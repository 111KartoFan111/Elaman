import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Лига Чемпионаты 2024/2025</h3>
            <p className="footer-description">
              Еуропаның ең үздік клубтары арасындағы турнир туралы ақпарат, матч нәтижелері және болжамдар.
            </p>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Пайдалы сілтемелер</h3>
            <ul className="footer-links">
              <li><Link to="/">Басты бет</Link></li>
              <li><Link to="/matches">Өткен матчтар</Link></li>
              <li><Link to="/upcoming">Келесі матчтар</Link></li>
              <li><Link to="/predictions">Болжамдар</Link></li>
              <li><Link to="/leaderboard">Көш бастаушылар</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Аккаунт</h3>
            <ul className="footer-links">
              <li><Link to="/login">Кіру</Link></li>
              <li><Link to="/register">Тіркелу</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {currentYear} Барлық құқықтар қорғалған.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;