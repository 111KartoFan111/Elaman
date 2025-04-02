// utils/LoginTesting.js
// Утилиты для тестирования авторизации и работы в режиме без сервера

/**
 * Набор функций для тестирования авторизации
 * Используется как резервный вариант, когда сервер недоступен
 */
const LoginTesting = {
  /**
   * Тестовые учетные данные
   */
  testUsers: [
    { username: 'user1', password: 'password1', userId: 1, fullName: 'Тестовый Пользователь 1' },
    { username: 'user2', password: 'password2', userId: 2, fullName: 'Тестовый Пользователь 2' },
    { username: 'admin', password: 'admin123', userId: 3, fullName: 'Администратор', isAdmin: true }
  ],
  
  /**
   * Попытка авторизации через сервер, с fallback на локальную авторизацию
   * @param {string} username имя пользователя
   * @param {string} password пароль
   * @returns {Promise<Object>} результат авторизации
   */
  loginUser: async (username, password) => {
    try {
      // Сначала пытаемся авторизоваться через сервер
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(10000) // 10-секундный таймаут
      });
      
      if (response.ok) {
        // Если сервер доступен, используем его ответ
        const data = await response.json();
        
        // Сохраняем токен и информацию о пользователе
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('username', data.user.username);
        
        // Сохраняем дополнительные данные пользователя, если есть
        if (data.user.profile) {
          localStorage.setItem('user_profile', JSON.stringify(data.user.profile));
        }
        
        return { success: true, user: data.user };
      } else {
        // Если сервер вернул ошибку, проверяем, может это тестовый пользователь
        return LoginTesting.handleLocalLogin(username, password);
      }
    } catch (error) {
      console.warn('Не удалось подключиться к серверу, используем локальную авторизацию', error);
      return LoginTesting.handleLocalLogin(username, password);
    }
  },
  
  /**
   * Локальная авторизация (для работы без сервера)
   * @param {string} username имя пользователя
   * @param {string} password пароль
   * @returns {Object} результат авторизации
   */
  handleLocalLogin: (username, password) => {
    // Проверка учетных данных
    const user = LoginTesting.testUsers.find(u => 
      u.username === username && u.password === password
    );
    
    if (user) {
      // Генерация фиктивного токена
      const token = `test_token_${user.userId}_${Date.now()}`;
      
      // Сохранение токена и информации о пользователе в localStorage
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_id', user.userId);
      localStorage.setItem('username', user.username);
      
      // Сохраняем дополнительную информацию о пользователе
      const userProfile = {
        full_name: user.fullName,
        is_admin: user.isAdmin || false,
        last_login: new Date().toISOString()
      };
      
      localStorage.setItem('user_profile', JSON.stringify(userProfile));
      
      // Инициализируем тестовые прогнозы для этого пользователя
      LoginTesting.initializeTestPredictions(user.userId);
      
      return { 
        success: true, 
        user: { 
          id: user.userId, 
          username: user.username,
          profile: userProfile,
          isTestUser: true
        } 
      };
    } else {
      return { success: false, error: 'Неверное имя пользователя или пароль' };
    }
  },
  
  /**
   * Выход пользователя с попыткой уведомления сервера
   * @returns {Promise<Object>} результат операции
   */
  logoutUser: async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Пытаемся выполнить выход на сервере
      if (token) {
        try {
          await fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            signal: AbortSignal.timeout(5000) // 5-секундный таймаут
          });
        } catch (error) {
          console.warn('Не удалось отправить запрос на выход', error);
        }
      }
    } catch (error) {
      console.warn('Ошибка при выходе на сервере', error);
    } finally {
      // В любом случае, очищаем локальное хранилище
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('user_profile');
      
      // Оставляем прогнозы в localStorage, чтобы потом их можно было синхронизировать
      
      return { success: true };
    }
  },
  
  /**
   * Проверка авторизации пользователя с сервера или локально
   * @returns {Promise<boolean>} результат проверки
   */
  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return false;
    }
    
    try {
      // Пытаемся проверить токен на сервере
      const response = await fetch('http://localhost:5000/api/auth/check-auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(5000) // 5-секундный таймаут
      });
      
      if (response.ok) {
        return true;
      } else if (response.status === 401) {
        // Если токен недействителен, удаляем его
        localStorage.removeItem('access_token');
        return false;
      } else {
        // При других ошибках считаем, что токен валиден
        return true;
      }
    } catch (error) {
      console.warn('Ошибка при проверке авторизации, используем локальную проверку', error);
      // Если нет связи с сервером, проверяем формат тестового токена
      if (token.startsWith('test_token_')) {
        return true;
      }
      // Для всех остальных токенов считаем, что они валидны
      return true;
    }
  },
  
  /**
   * Инициализирует тестовые прогнозы для пользователя
   * @param {number} userId ID пользователя
   */
  initializeTestPredictions: (userId) => {
    // Создаем тестовые прогнозы для этого пользователя
    const currentPredictions = JSON.parse(localStorage.getItem('user_predictions')) || {};
    
    // Добавляем тестовые данные только если у пользователя еще нет прогнозов
    let userHasPredictions = false;
    
    Object.values(currentPredictions).forEach(pred => {
      if (pred.user_id === userId) {
        userHasPredictions = true;
      }
    });
    
    if (userHasPredictions) {
      return; // У пользователя уже есть прогнозы, не перезаписываем их
    }
    
    // Добавляем тестовые прогнозы в зависимости от ID пользователя
    if (userId === 1) {
      // Для первого пользователя
      currentPredictions['1'] = {
        id: 101,
        match_id: 1,
        home_score: 3,
        away_score: 1,
        comment: 'Барселона должна выиграть дома, они в отличной форме',
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_local_only: false
      };
    } else if (userId === 2) {
      // Для второго пользователя
      currentPredictions['1'] = {
        id: 201,
        match_id: 1,
        home_score: 2,
        away_score: 2,
        comment: 'Думаю, будет ничья - обе команды сильные',
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_local_only: false
      };
      
      currentPredictions['2'] = {
        id: 202,
        match_id: 2,
        home_score: 1,
        away_score: 2,
        comment: 'Манчестер Сити в гостях должен выиграть',
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_local_only: false
      };
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('user_predictions', JSON.stringify(currentPredictions));
  },
  
  /**
   * Получает информацию о текущем авторизованном пользователе
   * @returns {Object|null} данные пользователя или null, если не авторизован
   */
  getCurrentUser: () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return null;
    }
    
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    const userProfileJson = localStorage.getItem('user_profile');
    
    let userProfile = null;
    
    if (userProfileJson) {
      try {
        userProfile = JSON.parse(userProfileJson);
      } catch (error) {
        console.error('Ошибка при парсинге профиля пользователя:', error);
      }
    }
    
    return {
      id: userId ? parseInt(userId) : null,
      username: username || 'unknown',
      profile: userProfile,
      isTestUser: token.startsWith('test_token_')
    };
  },
  
  /**
   * Инициализирует тестовое окружение при запуске приложения
   */
  initTestEnvironment: () => {
    // Проверяем, инициализировано ли уже тестовое окружение
    if (localStorage.getItem('test_env_initialized')) {
      return;
    }
    
    // Инициализируем тестовые матчи, если их еще нет
    if (!localStorage.getItem('upcoming_matches')) {
      const TEST_MATCHES = [
        {
          id: 1,
          home_team: 'Барселона',
          away_team: 'Бавария',
          match_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          stage: 'Лига Чемпионаты, 1/4 финал',
          stadium: 'Камп Ноу'
        },
        {
          id: 2,
          home_team: 'Реал Мадрид',
          away_team: 'Манчестер Сити',
          match_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          stage: 'Лига Чемпионаты, 1/4 финал',
          stadium: 'Сантьяго Бернабеу'
        },
        {
          id: 3,
          home_team: 'ПСЖ',
          away_team: 'Ливерпуль',
          match_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          stage: 'Лига Чемпионаты, 1/4 финал',
          stadium: 'Парк де Пренс'
        }
      ];
      
      localStorage.setItem('upcoming_matches', JSON.stringify(TEST_MATCHES));
    }
    
    // Отмечаем, что тестовое окружение инициализировано
    localStorage.setItem('test_env_initialized', 'true');
    
    console.log('Тестовое окружение инициализировано');
  }
};

// Автоматически инициализируем тестовое окружение при импорте
LoginTesting.initTestEnvironment();

export default LoginTesting;