import os
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import config
from database import init_db
from routes import auth_bp, matches_bp, predictions_bp

def create_app(config_name='default'):
    """Создание экземпляра приложения Flask"""
    app = Flask(__name__)
    
    # Загрузка конфигурации
    app.config.from_object(config[config_name])
    
    # Инициализация CORS
    CORS(app)
    
    # Инициализация JWT
    jwt = JWTManager(app)
    
    # Инициализация базы данных
    init_db(app)
    
    # Регистрация Blueprint'ов
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(matches_bp, url_prefix='/api/matches')
    app.register_blueprint(predictions_bp, url_prefix='/api/predictions')
    
    # Обработчик ошибок 404
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Ресурс не найден'}), 404
    
    # Обработчик ошибок 500
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'message': 'Внутренняя ошибка сервера'}), 500
    
    # Простой маршрут для проверки, что API работает
    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'API работает!'}), 200
    
    return app

if __name__ == '__main__':
    # Определение окружения (разработка/продакшн)
    env = os.environ.get('FLASK_ENV', 'development')
    
    # Создание приложения
    app = create_app(env)
    
    # Запуск приложения
    app.run(host='0.0.0.0', port=5000, debug=env=='development')