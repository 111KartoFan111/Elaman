import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Matches from './pages/Matches';
import UpcomingMatches from './pages/UpcomingMatches';
import Predictions from './pages/Predictions';
import Leaderboard from './pages/Leaderboard.jsx';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('access_token') !== null;
  
  if (!isAuthenticated) {
    // Перенаправляем на страницу входа, если пользователь не авторизован
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/upcoming" element={<UpcomingMatches />} />
      <Route path="/predictions" element={<Predictions />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Пример защищенного маршрута (требуется авторизация) */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <div>Профиль пользователя</div>
          </ProtectedRoute>
        } 
      />
      
      {/* Маршрут по умолчанию (404) */}
      <Route path="*" element={<div>404 - Страница не найдена</div>} />
    </Routes>
  );
}

export default App;