from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models.match import Match
from models.user import User
from datetime import datetime

matches_bp = Blueprint('matches', __name__)

@matches_bp.route('/matches', methods=['GET'])
def get_matches():
    """Получение всех матчей"""
    # Параметры фильтрации
    status = request.args.get('status')
    team = request.args.get('team')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    
    # Базовый запрос
    query = Match.query
    
    # Применяем фильтры
    if status == 'past':
        query = query.filter(Match.match_date < datetime.utcnow()).order_by(Match.match_date.desc())
    elif status == 'upcoming':
        query = query.filter(Match.match_date > datetime.utcnow()).order_by(Match.match_date.asc())
    else:
        query = query.order_by(Match.match_date.desc())
    
    if team:
        query = query.filter((Match.home_team.ilike(f'%{team}%')) | (Match.away_team.ilike(f'%{team}%')))
    
    if from_date:
        try:
            from_date = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
            query = query.filter(Match.match_date >= from_date)
        except ValueError:
            pass
    
    if to_date:
        try:
            to_date = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
            query = query.filter(Match.match_date <= to_date)
        except ValueError:
            pass
    
    # Выполняем запрос и форматируем результат
    matches = query.all()
    result = [match.to_dict() for match in matches]
    
    return jsonify(result), 200

@matches_bp.route('/matches/<int:id>', methods=['GET'])
def get_match(id):
    """Получение информации о конкретном матче"""
    match = Match.query.get(id)
    
    if not match:
        return jsonify({'message': 'Матч не найден'}), 404
    
    return jsonify(match.to_dict()), 200

@matches_bp.route('/matches', methods=['POST'])
@jwt_required()
def create_match():
    """Создание нового матча (только для админов)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'message': 'Доступ запрещен'}), 403
    
    data = request.get_json()
    required_fields = ['home_team', 'away_team', 'match_date']
    
    if not all(field in data for field in required_fields):
        return jsonify({'message': 'Не все обязательные поля заполнены'}), 400
    
    # Преобразуем строку даты в объект datetime
    try:
        match_date = datetime.fromisoformat(data['match_date'].replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'message': 'Неверный формат даты'}), 400
    
    match = Match(
        home_team=data['home_team'],
        away_team=data['away_team'],
        match_date=match_date,
        stadium=data.get('stadium'),
        stage=data.get('stage'),
        status=data.get('status', 'scheduled')
    )
    
    db.session.add(match)
    db.session.commit()
    
    return jsonify({'message': 'Матч успешно создан', 'match_id': match.id}), 201

@matches_bp.route('/matches/<int:id>', methods=['PUT'])
@jwt_required()
def update_match(id):
    """Обновление информации о матче (только для админов)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'message': 'Доступ запрещен'}), 403
    
    match = Match.query.get(id)
    
    if not match:
        return jsonify({'message': 'Матч не найден'}), 404
    
    data = request.get_json()
    
    # Обновляем поля
    if 'home_team' in data:
        match.home_team = data['home_team']
    if 'away_team' in data:
        match.away_team = data['away_team']
    if 'home_score' in data:
        match.home_score = data['home_score']
    if 'away_score' in data:
        match.away_score = data['away_score']
    if 'match_date' in data:
        try:
            match.match_date = datetime.fromisoformat(data['match_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'message': 'Неверный формат даты'}), 400
    if 'stadium' in data:
        match.stadium = data['stadium']
    if 'stage' in data:
        match.stage = data['stage']
    if 'status' in data:
        match.status = data['status']
    
    db.session.commit()
    
    # Если матч был завершен, обновляем очки для всех прогнозов
    if match.status == 'finished' and match.home_score is not None and match.away_score is not None:
        for prediction in match.predictions:
            prediction.points_earned = prediction.calculate_points()
        db.session.commit()
    
    return jsonify({'message': 'Матч успешно обновлен'}), 200

@matches_bp.route('/matches/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_match(id):
    """Удаление матча (только для админов)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'message': 'Доступ запрещен'}), 403
    
    match = Match.query.get(id)
    
    if not match:
        return jsonify({'message': 'Матч не найден'}), 404
    
    db.session.delete(match)
    db.session.commit()
    
    return jsonify({'message': 'Матч успешно удален'}), 200

@matches_bp.route('/past-matches', methods=['GET'])
def get_past_matches():
    """Получение всех прошедших матчей"""
    matches = Match.query.filter(
        (Match.match_date < datetime.utcnow()) | (Match.status == 'finished')
    ).order_by(Match.match_date.desc()).all()
    
    result = [match.to_dict() for match in matches]
    return jsonify(result), 200

@matches_bp.route('/upcoming-matches', methods=['GET'])
def get_upcoming_matches():
    """Получение всех предстоящих матчей"""
    matches = Match.query.filter(
        (Match.match_date > datetime.utcnow()) & (Match.status != 'finished')
    ).order_by(Match.match_date.asc()).all()
    
    result = [match.to_dict() for match in matches]
    return jsonify(result), 200