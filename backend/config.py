import os
from datetime import timedelta

class Config:
    """Базовая конфигурация"""
    # Секретный ключ для сессий и токенов
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'champions-league-predictor-secret-key'
    
    # Настройки SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(os.path.dirname(os.path.abspath(__file__)), 'champions.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Настройки JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'champions-league-jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

class DevelopmentConfig(Config):
    """Конфигурация для разработки"""
    DEBUG = True
    
class TestingConfig(Config):
    """Конфигурация для тестирования"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
class ProductionConfig(Config):
    """Конфигурация для продакшена"""
    DEBUG = False
    # В продакшене следует использовать настоящие секретные ключи из переменных окружения

# Словарь доступных конфигураций
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}