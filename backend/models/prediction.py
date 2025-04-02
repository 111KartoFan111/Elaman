from database import db
from datetime import datetime

class Prediction(db.Model):
    """Модель прогноза на матч"""
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id'), nullable=False)
    home_score = db.Column(db.Integer, nullable=False)
    away_score = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    subject = db.Column(db.String(255), nullable=True)  # Добавлено поле subject
    points_earned = db.Column(db.Integer, nullable=True)  # Очки, заработанные за прогноз (если матч завершен)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def prediction_result(self):
        """Результат прогноза (если матч завершен)"""
        if not self.match.is_past or self.match.home_score is None or self.match.away_score is None:
            return None
            
        actual_result = self._get_result(self.match.home_score, self.match.away_score)
        predicted_result = self._get_result(self.home_score, self.away_score)
        
        if self.match.home_score == self.home_score and self.match.away_score == self.away_score:
            return "Точный счет"
        elif actual_result == predicted_result:
            return "Исход"
        else:
            return "Неверно"
    
    def _get_result(self, home, away):
        """Определение результата матча (победа домашней команды, ничья, победа гостей)"""
        if home > away:
            return "1"  # Победа домашней команды
        elif home < away:
            return "2"  # Победа гостевой команды
        else:
            return "X"  # Ничья
    
    def calculate_points(self):
        """Расчет очков за прогноз"""
        if not self.match.is_past or self.match.home_score is None or self.match.away_score is None:
            return 0
            
        if self.match.home_score == self.home_score and self.match.away_score == self.away_score:
            return 3  # Точный счет
        
        actual_result = self._get_result(self.match.home_score, self.match.away_score)
        predicted_result = self._get_result(self.home_score, self.away_score)
        
        if actual_result == predicted_result:
            return 1  # Правильный исход
        else:
            return 0  # Неверный прогноз
    
    def to_dict(self):
        """Сериализация модели в словарь"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'match_id': self.match_id,
            'home_score': self.home_score,
            'away_score': self.away_score,
            'comment': self.comment,
            'subject': self.subject,  # Добавлено в сериализацию
            'points_earned': self.points_earned,
            'prediction_result': self.prediction_result,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Prediction {self.user.username}: {self.match.home_team} {self.home_score}-{self.away_score} {self.match.away_team}>'