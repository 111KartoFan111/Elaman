from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models.prediction import Prediction
from models.match import Match
from models.user import User
from datetime import datetime
import logging
from flask import current_app

# Create the Blueprint without duplicating the route prefix
predictions_bp = Blueprint('predictions', __name__)

@predictions_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_predictions():
    """Получение всех прогнозов текущего пользователя"""
    # Подробное логирование
    current_app.logger.info("=== Starting get_user_predictions() ===")
    
    try:
        # Детально логируем заголовки
        current_app.logger.info(f"Request headers: {dict(request.headers)}")
        
        # Получаем ID текущего пользователя
        current_user_id = get_jwt_identity()
        current_app.logger.info(f"JWT identity (user_id): {current_user_id}")
        
        # Поиск пользователя
        user = User.query.get(current_user_id)
        if not user:
            current_app.logger.warning(f"User not found. User ID: {current_user_id}")
            return jsonify({'message': 'Пользователь не найден'}), 404
            
        current_app.logger.info(f"User found: {user.username}")
        
        # Проверка параметров запроса
        match_status = request.args.get('match_status')
        current_app.logger.info(f"Request params - match_status: {match_status}")
        
        # Базовый запрос
        try:
            query = Prediction.query.filter_by(user_id=current_user_id)
            current_app.logger.info(f"Base query created")
            
            # Объединяем с таблицей матчей для фильтрации
            if match_status:
                current_app.logger.info(f"Filtering by match_status: {match_status}")
                
                if match_status == 'past':
                    query = query.join(Match).filter(
                        (Match.match_date < datetime.utcnow()) | (Match.status == 'finished')
                    )
                elif match_status == 'upcoming':
                    query = query.join(Match).filter(
                        (Match.match_date > datetime.utcnow()) & (Match.status != 'finished')
                    )
                else:
                    current_app.logger.warning(f"Invalid match_status: {match_status}")
                    return jsonify({'message': f'Недопустимое значение match_status: {match_status}'}), 400
            
            # Выполняем запрос
            current_app.logger.info("Executing query...")
            predictions = query.all()
            current_app.logger.info(f"Query returned {len(predictions)} predictions")
            
            # Форматируем результат
            result = []
            for prediction in predictions:
                try:
                    current_app.logger.info(f"Processing prediction ID: {prediction.id}")
                    
                    # Создаем базовый словарь вручную вместо вызова to_dict()
                    prediction_data = {
                        'id': prediction.id,
                        'user_id': prediction.user_id,
                        'match_id': prediction.match_id,
                        'home_score': prediction.home_score,
                        'away_score': prediction.away_score,
                        'comment': prediction.comment,
                        'points_earned': prediction.points_earned,
                        'created_at': prediction.created_at.isoformat() if prediction.created_at else None,
                        'updated_at': prediction.updated_at.isoformat() if prediction.updated_at else None
                    }
                    
                    # Добавляем subject только если атрибут существует
                    if hasattr(prediction, 'subject'):
                        prediction_data['subject'] = prediction.subject
                        
                    # Безопасное получение данных матча
                    try:
                        if hasattr(prediction, 'match') and prediction.match:
                            current_app.logger.info(f"Adding match data for match ID: {prediction.match_id}")
                            match_data = {
                                'id': prediction.match.id,
                                'home_team': prediction.match.home_team,
                                'away_team': prediction.match.away_team,
                                'match_date': prediction.match.match_date.isoformat() if prediction.match.match_date else None,
                                'status': prediction.match.status
                            }
                            
                            # Добавляем дополнительные поля, если они есть
                            if hasattr(prediction.match, 'home_score') and prediction.match.home_score is not None:
                                match_data['home_score'] = prediction.match.home_score
                            if hasattr(prediction.match, 'away_score') and prediction.match.away_score is not None:
                                match_data['away_score'] = prediction.match.away_score
                                
                            prediction_data['match'] = match_data
                        else:
                            current_app.logger.warning(f"Match not found for prediction ID: {prediction.id}")
                            prediction_data['match'] = None
                    except Exception as match_error:
                        current_app.logger.error(f"Error processing match data: {str(match_error)}")
                        prediction_data['match'] = {'error': 'Unable to load match data'}
                        
                    result.append(prediction_data)
                except Exception as pred_error:
                    current_app.logger.error(f"Error processing prediction {prediction.id}: {str(pred_error)}")
                    # Продолжаем с другими прогнозами
            
            current_app.logger.info("=== get_user_predictions() completed successfully ===")
            return jsonify(result), 200
            
        except Exception as query_error:
            current_app.logger.error(f"Database query error: {str(query_error)}")
            return jsonify({'message': 'Ошибка при выполнении запроса к базе данных', 'error': str(query_error)}), 500
            
    except Exception as e:
        current_app.logger.error(f"Unexpected error in get_user_predictions(): {str(e)}")
        return jsonify({'message': 'Произошла непредвиденная ошибка', 'error': str(e)}), 500

@predictions_bp.route('/<int:match_id>', methods=['POST'])
@jwt_required()
def create_prediction(match_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Проверка существования матча
    match = Match.query.get(match_id)
    if not match:
        return jsonify({'message': 'Матч не найден'}), 404

    # Проверка, что матч еще не начался
    if match.match_date < datetime.utcnow():
        return jsonify({'message': 'Нельзя делать прогноз на прошедший матч'}), 400

    # Проверка, что прогноз еще не существует
    existing = Prediction.query.filter_by(user_id=current_user_id, match_id=match_id).first()
    if existing:
        return jsonify({'message': 'Прогноз для этого матча уже существует'}), 400

    prediction = Prediction(
        user_id=current_user_id,
        match_id=match_id,
        home_score=data.get('home_score'),
        away_score=data.get('away_score'),
        comment=data.get('comment', '')
    )
    db.session.add(prediction)
    db.session.commit()

    return jsonify({
        'id': prediction.id,
        'match_id': prediction.match_id,
        'home_score': prediction.home_score,
        'away_score': prediction.away_score,
        'comment': prediction.comment
    }), 201

@predictions_bp.route('/<int:prediction_id>', methods=['PUT'])
@jwt_required()
def update_prediction(prediction_id):
    current_user_id = get_jwt_identity()
    prediction = Prediction.query.get(prediction_id)

    if not prediction or prediction.user_id != current_user_id:
        return jsonify({'message': 'Прогноз не найден или доступ запрещен'}), 404

    # Проверка, что матч еще не начался
    match = Match.query.get(prediction.match_id)
    if match.match_date < datetime.utcnow():
        return jsonify({'message': 'Нельзя редактировать прогноз после начала матча'}), 400

    data = request.get_json()
    prediction.home_score = data.get('home_score', prediction.home_score)
    prediction.away_score = data.get('away_score', prediction.away_score)
    prediction.comment = data.get('comment', prediction.comment)
    db.session.commit()

    return jsonify({
        'id': prediction.id,
        'match_id': prediction.match_id,
        'home_score': prediction.home_score,
        'away_score': prediction.away_score,
        'comment': prediction.comment
    }), 200