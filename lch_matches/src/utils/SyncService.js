// utils/SyncService.js
// Сервис для синхронизации данных между localStorage и сервером

/**
 * Сервис синхронизации данных с сервером
 * Позволяет работать в оффлайн режиме и синхронизировать данные при восстановлении соединения
 */
const SyncService = {
  /**
   * Проверяет доступность сервера
   * @returns {Promise<boolean>} результат проверки соединения
   */
  checkConnection: async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Таймаут для проверки соединения
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.warn('Ошибка соединения с сервером:', error);
      return false;
    }
  },
  
  /**
   * Загружает матчи с сервера или из localStorage
   * @returns {Promise<Array>} массив матчей
   */
  fetchMatches: async () => {
    try {
      // Проверяем наличие кэшированных данных
      const cachedMatches = localStorage.getItem('upcoming_matches');
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
      
      // Пытаемся получить данные с сервера
      try {
        const response = await fetch('http://localhost:5000/api/matches/upcoming-matches', {
          signal: AbortSignal.timeout(10000) // 10-секундный таймаут
        });
        
        if (response.ok) {
          const data = await response.json();
          // Сохраняем в localStorage для кэширования
          localStorage.setItem('upcoming_matches', JSON.stringify(data));
          return data;
        }
      } catch (error) {
        console.warn('Не удалось получить матчи с сервера, используем кэш', error);
      }
      
      // Если не удалось получить с сервера, используем localStorage
      return cachedMatches ? JSON.parse(cachedMatches) : TEST_MATCHES;
    } catch (err) {
      console.error('Ошибка при получении матчей:', err);
      // В случае полной ошибки возвращаем тестовые данные
      return TEST_MATCHES;
    }
  },
  
  /**
   * Загружает прогнозы пользователя с сервера или из localStorage
   * @returns {Promise<Object>} объект прогнозов по match_id
   */
  fetchUserPredictions: async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        return {};
      }
      
      // Пытаемся получить с сервера
      try {
        const response = await fetch('http://localhost:5000/api/predictions/predictions?match_status=upcoming', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: AbortSignal.timeout(10000) // 10-секундный таймаут
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Преобразуем массив прогнозов в объект для удобного доступа по match_id
          const predictionsMap = {};
          data.forEach(prediction => {
            predictionsMap[prediction.match_id] = prediction;
          });
          
          // Обновляем локальное хранилище, сохраняя локальные флаги
          const localPredictions = JSON.parse(localStorage.getItem('user_predictions')) || {};
          
          // Объединяем данные с сервера и локальные данные
          const mergedPredictions = {...predictionsMap};
          
          // Добавляем локальные прогнозы, которых нет на сервере
          Object.values(localPredictions).forEach(localPred => {
            if (localPred.is_local_only && !mergedPredictions[localPred.match_id]) {
              mergedPredictions[localPred.match_id] = localPred;
            }
          });
          
          localStorage.setItem('user_predictions', JSON.stringify(mergedPredictions));
          
          return mergedPredictions;
        } else if (response.status === 401) {
          // Если токен истек, очищаем его
          localStorage.removeItem('access_token');
          return {};
        }
      } catch (error) {
        console.warn('Не удалось получить прогнозы с сервера, используем локальное хранилище', error);
      }
      
      // Если не удалось получить с сервера, используем localStorage
      return JSON.parse(localStorage.getItem('user_predictions')) || {};
    } catch (err) {
      console.error('Ошибка при получении прогнозов:', err);
      return JSON.parse(localStorage.getItem('user_predictions')) || {};
    }
  },
  
  /**
   * Отправляет прогноз на сервер или сохраняет локально
   * @param {number} matchId ID матча
   * @param {number|string} homeScore счет домашней команды
   * @param {number|string} awayScore счет гостевой команды
   * @param {string} comment комментарий к прогнозу
   * @returns {Promise<Object>} результат операции
   */
  submitPrediction: async (matchId, homeScore, awayScore, comment) => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return { success: false, message: 'Необходима авторизация' };
    }
    
    // Получаем текущие прогнозы
    const currentPredictions = JSON.parse(localStorage.getItem('user_predictions')) || {};
    const existingPrediction = currentPredictions[matchId];
    
    const requestData = {
      home_score: parseInt(homeScore),
      away_score: parseInt(awayScore),
      comment: comment || '',
    };
    
    // Пытаемся отправить на сервер
    try {
      let url;
      let method;
      
      if (existingPrediction && !existingPrediction.is_local_only) {
        url = `http://localhost:5000/api/predictions/${existingPrediction.id}`;
        method = 'PUT';
      } else {
        url = `http://localhost:5000/api/predictions/${matchId}`;
        method = 'POST';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(10000) // 10-секундный таймаут
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Обновляем локальное хранилище
        currentPredictions[matchId] = {
          ...responseData,
          is_local_only: false
        };
        
        localStorage.setItem('user_predictions', JSON.stringify(currentPredictions));
        
        return { 
          success: true, 
          message: 'Прогноз успешно сохранен на сервере',
          data: responseData,
          isLocal: false
        };
      } else if (response.status === 401) {
        localStorage.removeItem('access_token');
        return { success: false, message: 'Необходима повторная авторизация' };
      } else {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    } catch (error) {
      console.warn('Не удалось отправить прогноз на сервер, сохраняем локально', error);
      
      // Сохраняем локально
      const newPrediction = {
        id: existingPrediction?.id || `local_${Date.now()}`,
        match_id: parseInt(matchId),
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore),
        comment: comment || '',
        user_id: parseInt(localStorage.getItem('user_id') || '1'),
        created_at: existingPrediction?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_local_only: true
      };
      
      // Обновляем локальное хранилище
      currentPredictions[matchId] = newPrediction;
      localStorage.setItem('user_predictions', JSON.stringify(currentPredictions));
      
      return { 
        success: true, 
        message: 'Прогноз сохранен локально. Синхронизация с сервером произойдет при восстановлении соединения.',
        data: newPrediction,
        isLocal: true
      };
    }
  },
  
  /**
   * Синхронизирует локальные прогнозы с сервером
   * @returns {Promise<Object>} результат синхронизации
   */
  syncPredictions: async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        return { success: false, message: 'Необходима авторизация' };
      }
      
      // Получаем локальные прогнозы
      const localPredictions = JSON.parse(localStorage.getItem('user_predictions')) || {};
      
      // Находим прогнозы, которые сохранены только локально
      const localOnlyPredictions = Object.values(localPredictions)
        .filter(pred => pred.is_local_only === true);
      
      if (localOnlyPredictions.length === 0) {
        return { success: true, message: 'Нет данных для синхронизации', syncedCount: 0 };
      }
      
      // Проверяем соединение
      const isConnected = await SyncService.checkConnection();
      
      if (!isConnected) {
        return { success: false, message: 'Нет соединения с сервером' };
      }
      
      // Синхронизируем каждый прогноз
      let syncedCount = 0;
      const updatedPredictions = {...localPredictions};
      
      for (const prediction of localOnlyPredictions) {
        try {
          const isLocalId = prediction.id.toString().startsWith('local_');
          const method = isLocalId ? 'POST' : 'PUT';
          const url = method === 'POST'
            ? `http://localhost:5000/api/predictions/${prediction.match_id}`
            : `http://localhost:5000/api/predictions/${prediction.id}`;
          
          const requestData = {
            home_score: prediction.home_score,
            away_score: prediction.away_score,
            comment: prediction.comment || ''
          };
          
          const response = await fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
          });
          
          if (response.ok) {
            const responseData = await response.json();
            // Обновляем данные в локальном хранилище
            updatedPredictions[prediction.match_id] = {
              ...responseData,
              is_local_only: false
            };
            syncedCount++;
          }
        } catch (error) {
          console.error(`Ошибка синхронизации прогноза для матча ${prediction.match_id}:`, error);
        }
      }
      
      // Сохраняем обновленные прогнозы в localStorage
      localStorage.setItem('user_predictions', JSON.stringify(updatedPredictions));
      
      return { 
        success: true, 
        message: `Синхронизировано ${syncedCount} из ${localOnlyPredictions.length} прогнозов`,
        syncedCount,
        totalCount: localOnlyPredictions.length
      };
    } catch (error) {
      console.error('Ошибка синхронизации прогнозов:', error);
      return { success: false, message: 'Ошибка синхронизации: ' + error.message };
    }
  },
  
  /**
   * Автоматическая синхронизация всех данных
   * @returns {Promise<Object>} результат синхронизации
   */
  autoSync: async () => {
    const isConnected = await SyncService.checkConnection();
    
    if (!isConnected) {
      return { success: false, message: 'Нет соединения с сервером' };
    }
    
    // Синхронизируем прогнозы
    const predictionsSyncResult = await SyncService.syncPredictions();
    
    return {
      success: predictionsSyncResult.success,
      predictions: predictionsSyncResult,
      timestamp: new Date().toISOString()
    };
  },
  
  /**
   * Очищает все локальные данные
   */
  clearLocalData: () => {
    // Предупреждение: это очистит все данные приложения
    // Оставляем только токен авторизации
    const token = localStorage.getItem('access_token');
    localStorage.clear();
    if (token) {
      localStorage.setItem('access_token', token);
    }
  }
};

export default SyncService;