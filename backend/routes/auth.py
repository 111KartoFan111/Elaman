from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from database import db
from models.user import User
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    data = request.get_json()
    
    # Проверяем, что все необходимые поля присутствуют
    if not all(k in data for k in ('username', 'email', 'password')):
        return jsonify({'message': 'Не все обязательные поля заполнены'}), 400
    
    # Проверяем, что пользователь с таким username или email не существует
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Пользователь с таким именем уже существует'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Пользователь с таким email уже существует'}), 409
    
    # Создаем нового пользователя
    user = User(
        username=data['username'],
        email=data['email']
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'Пользователь успешно зарегистрирован', 'user_id': user.id}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Вход пользователя"""
    data = request.get_json()
    
    # Проверяем, что все необходимые поля присутствуют
    if not all(k in data for k in ('username', 'password')):
        return jsonify({'message': 'Не все обязательные поля заполнены'}), 400
    
    # Находим пользователя
    user = User.query.filter_by(username=data['username']).first()
    
    # Проверяем пароль
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Неверное имя пользователя или пароль'}), 401
    
    # Обновляем время последнего входа
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Создаем JWT токены
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'message': 'Авторизация успешна',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Обновление access токена"""
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    
    return jsonify({'access_token': access_token}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """Получение информации о текущем пользователе"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Пользователь не найден'}), 404
    
    return jsonify(user.to_dict()), 200

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Изменение пароля пользователя"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Пользователь не найден'}), 404
    
    data = request.get_json()
    
    if not all(k in data for k in ('current_password', 'new_password')):
        return jsonify({'message': 'Не все обязательные поля заполнены'}), 400
    
    if not user.check_password(data['current_password']):
        return jsonify({'message': 'Текущий пароль неверен'}), 401
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Пароль успешно изменен'}), 200