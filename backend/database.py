import os
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Инициализация SQLAlchemy
db = SQLAlchemy()

def init_db(app):
    """
    Инициализация базы данных с приложением Flask
    """
    # Создаем директорию для базы данных, если она не существует
    instance_path = os.path.join(os.path.dirname(app.root_path), 'instance')
    os.makedirs(instance_path, exist_ok=True)
    
    db.init_app(app)
    
    # Создаем таблицы при запуске приложения
    with app.app_context():
        # Импортируем модели внутри функции, чтобы избежать циклического импорта
        from models.user import User
        from models.match import Match
        from models.prediction import Prediction
        
        # Создаем все таблицы
        db.create_all()
        
        # Проверяем, пустая ли база данных
        if User.query.count() == 0:
            create_test_data()

def create_test_data():
    """
    Создание тестовых данных для БД
    """
    # Импортируем модели
    from models.user import User
    from models.match import Match
    from models.prediction import Prediction
    
    # Создаем тестовых пользователей
    admin = User(
        username='admin',
        email='admin@example.com',
        is_admin=True
    )
    admin.set_password('adminpass')
    
    user1 = User(
        username='user1',
        email='user1@example.com'
    )
    user1.set_password('user1pass')
    
    db.session.add_all([admin, user1])
    
    # Создаем тестовые матчи (прошедшие и будущие)
    past_matches = [
        Match(
            home_team='Барселона',
            away_team='Бавария',
            home_score=2,
            away_score=1,
            match_date=datetime(2024, 9, 15, 20, 0),
            status='finished'
        ),
        Match(
            home_team='ПСЖ',
            away_team='Манчестер Сити',
            home_score=0,
            away_score=2,
            match_date=datetime(2024, 9, 16, 20, 0),
            status='finished'
        )
    ]
    
    upcoming_matches = [
        Match(
            home_team='Реал Мадрид',
            away_team='Ливерпуль',
            match_date=datetime(2025, 4, 15, 20, 0),
            status='scheduled'
        ),
        Match(
            home_team='Арсенал',
            away_team='Интер',
            match_date=datetime(2025, 4, 16, 20, 0),
            status='scheduled'
        )
    ]
    
    db.session.add_all(past_matches + upcoming_matches)
    
    # Создаем тестовые прогнозы для будущих матчей
    predictions = [
        Prediction(
            user_id=2,  # user1
            match_id=3,  # Реал Мадрид - Ливерпуль
            home_score=3,
            away_score=1,
            comment='Думаю, Реал уверенно победит дома'
        ),
        Prediction(
            user_id=1,  # admin
            match_id=3,  # Реал Мадрид - Ливерпуль
            home_score=2,
            away_score=2,
            comment='Будет ничья с голами'
        )
    ]
    
    db.session.add_all(predictions)
    db.session.commit()