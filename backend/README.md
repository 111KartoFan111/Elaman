# Бэкенд для сайта Лиги Чемпионов 2024/25

Этот проект представляет собой бэкенд на Flask для сайта с результатами матчей Лиги Чемпионов и прогнозами пользователей.

## Функциональность

- Авторизация и регистрация пользователей
- Просмотр прошедших и предстоящих матчей
- Создание прогнозов на матчи
- Просмотр таблицы лидеров по прогнозам
- Администраторский функционал для управления матчами

## Структура проекта

```
backend/
├── app.py                  # Основной файл Flask-приложения
├── config.py               # Конфигурация приложения
├── database.py             # Настройка и подключение к БД
├── models/                 # Модели данных
├── routes/                 # Маршруты API
├── instance/               # Экземпляр базы данных SQLite
└── requirements.txt        # Зависимости проекта
```

## Установка и запуск

1. Создайте виртуальное окружение Python:

```bash
python -m venv venv
source venv/bin/activate  # Для Linux/Mac
venv\Scripts\activate     # Для Windows
```

2. Установите зависимости:

```bash
pip install -r requirements.txt
```

3. Запустите приложение:

```bash
python app.py
```

По умолчанию сервер будет запущен на http://localhost:5000.

## API endpoints

### Аутентификация

- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Авторизация
- `POST /api/auth/refresh` - Обновление токена доступа
- `GET /api/auth/me` - Получение информации о текущем пользователе
- `PUT /api/auth/change-password` - Изменение пароля

### Матчи

- `GET /api/matches/matches` - Получение всех матчей
- `GET /api/matches/matches/<id>` - Получение конкретного матча
- `POST /api/matches/matches` - Создание нового матча (только админ)
- `PUT /api/matches/matches/<id>` - Обновление матча (только админ)
- `DELETE /api/matches/matches/<id>` - Удаление матча (только админ)
- `GET /api/matches/past-matches` - Получение всех прошедших матчей
- `GET /api/matches/upcoming-matches` - Получение всех предстоящих матчей

### Прогнозы

- `GET /api/predictions/predictions` - Получение прогнозов текущего пользователя
- `POST /api/predictions/predictions/<match_id>` - Создание прогноза на матч
- `PUT /api/predictions/predictions/<prediction_id>` - Обновление прогноза
- `DELETE /api/predictions/predictions/<prediction_id>` - Удаление прогноза
- `GET /api/predictions/match/<match_id>/predictions` - Получение всех прогнозов на матч
- `GET /api/predictions/leaderboard` - Получение таблицы лидеров

## Тестовые данные

При первом запуске приложения создаются тестовые данные:
- Два пользователя: admin и user1
- Несколько прошедших и предстоящих матчей
- Несколько прогнозов на матчи

## Интеграция с фронтендом

Для интеграции с React-фронтендом используйте следующие URL в API-запросах:

```javascript
// Пример запроса на получение прошедших матчей
fetch('http://localhost:5000/api/matches/past-matches')
  .then(response => response.json())
  .then(data => console.log(data));
```