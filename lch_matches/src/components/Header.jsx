import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';
import uefaLogo from '../assets/logotype_dark.svg';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Проверяем авторизацию при загрузке компонента
    const token = localStorage.getItem('access_token');
    const userInfo = localStorage.getItem('user');
    
    if (token && userInfo) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userInfo));
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, [location.pathname]); // Обновляем состояние при изменении пути

  const handleLogout = () => {
    // Удаляем данные авторизации
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    setIsLoggedIn(false);
    setUser(null);
    setMenuOpen(false);
    
    // Перенаправляем на главную страницу
    navigate('/');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <img src={uefaLogo} alt="UEFA Champions League" className="uefa-logo" />
          </Link>
        </div>
        
        <button className="menu-toggle" onClick={toggleMenu}>
          <span className="menu-icon"></span>
          
        </button>
        
        <nav className={`main-nav ${menuOpen ? 'active' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/" className="nav-link" onClick={closeMenu}>Басты бет</Link>
            </li>
            <li className="nav-item">
              <Link to="/matches" className="nav-link" onClick={closeMenu}>Өткен матчтар</Link>
            </li>
            <li className="nav-item">
              <Link to="/upcoming" className="nav-link" onClick={closeMenu}>Келесі матчтар</Link>
            </li>
            <li className="nav-item">
              <Link to="/predictions" className="nav-link" onClick={closeMenu}>Болжамдар</Link>
            </li>
            <li className="nav-item">
              <Link to="/leaderboard" className="nav-link" onClick={closeMenu}>Көш бастаушылар</Link>
            </li>
          </ul>
          
          <div className="auth-nav">
            {isLoggedIn ? (
              <div className="user-menu">
                <div className="user-info">
                  <span className="username">{user?.username}</span>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                  Шығу
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="login-button" onClick={closeMenu}>
                  Кіру
                </Link>
                <Link to="/register" className="register-button" onClick={closeMenu}>
                  Тіркелу
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;