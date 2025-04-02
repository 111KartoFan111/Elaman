from database import db
from datetime import datetime

class Match(db.Model):
    """Модель футбольного матча"""
    __tablename__ = 'matches'
    
    id = db.Column(db.Integer, primary_key=True)
    home_team = db.Column(db.String(100), nullable=False)
    away_team = db.Column(db.String(100), nullable=False)
    home_score = db.Column(db.Integer, nullable=True)
    away_score = db.Column(db.Integer, nullable=True)
    match_date = db.Column(db.DateTime, nullable=False)
    stadium = db.Column(db.String(100), nullable=True)
    stage = db.Column(db.String(50), nullable=True)  # Например: "Групповой этап", "1/8 финала" и т.д.
    status = db.Column(db.String(20), default='scheduled')  # scheduled, live, finished, postponed, canceled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Отношения
    predictions = db.relationship('Prediction', backref='match', lazy=True, cascade='all, delete-orphan')
    
    @property
    def is_past(self):
        """Прошел ли матч"""
        return self.match_date < datetime.utcnow() or self.status == 'finished'
    
    @property
    def is_upcoming(self):
        """Предстоящий ли матч"""
        return self.match_date > datetime.utcnow() and self.status in ['scheduled', 'postponed']
    
    def to_dict(self):
        """Сериализация модели в словарь"""
        return {
            'id': self.id,
            'home_team': self.home_team,
            'away_team': self.away_team,
            'home_score': self.home_score,
            'away_score': self.away_score,
            'match_date': self.match_date.isoformat() if self.match_date else None,
            'stadium': self.stadium,
            'stage': self.stage,
            'status': self.status,
            'is_past': self.is_past,
            'is_upcoming': self.is_upcoming,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        scores = f" ({self.home_score}:{self.away_score})" if self.home_score is not None and self.away_score is not None else ""
        return f'<Match {self.home_team} vs {self.away_team}{scores}>'