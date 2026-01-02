 
// Normalize VITE_API_BASE_URL so malformed values like ":5000/api" still work
function normalizeApiBase(raw) {
  let val = raw || '';

  if (!val) return 'http://localhost:5000/api';

  // If it starts with ':' (e.g. :5006/api), prefix with localhost
  if (val.startsWith(':')) val = `http://localhost${val}`;

  // If it starts with 'localhost:...' without protocol, add http://
  if (/^localhost:\d+/i.test(val)) val = `http://${val}`;

  // If missing protocol entirely (no http:// or https://), assume http://
  if (!/^https?:\/\//i.test(val)) val = `http://${val}`;

  // Remove trailing slash
  val = val.replace(/\/$/, '');

  return val;
}

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = normalizeApiBase(RAW_API_BASE) || 'http://localhost:5000/api';
// Backend origin without the /api suffix
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

// Export normalized URLs for other modules to reuse
export { API_BASE_URL, BACKEND_ORIGIN };

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  // eslint-disable-next-line no-unused-vars
  } catch (networkErr) {
    throw new Error('شبكة غير متاحة — تعذر الوصول إلى الخادم');
  }

  // Try to parse JSON safely
  let data = null;
  try {
    data = await response.json();
  // eslint-disable-next-line no-unused-vars
  } catch (parseErr) {
    // Non-JSON response
    if (!response.ok) {
      throw new Error(`الخادم رد بحالة ${response.status}`);
    }
    return null;
  }

  if (!response.ok) {
    throw new Error(data.error || 'حدث خطأ ما');
  }

  return data;
}

 
export const authAPI = {
  // Register new user
  signup: async (userData) => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
      }),
    });
  },

  // Login user
  login: async (email, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Logout user
  logout: async () => {
    return apiCall('/auth/logout', { method: 'POST' });
  },

  // Get current user
  getCurrentUser: async () => {
    return apiCall('/auth/me');
  },
};

 
export const quizAPI = {
  // Get all questions for a phase (from database)
  getQuestionsByPhase: async (phaseId) => {
    return apiCall(`/questions/phase/${phaseId}`);
  },

  // Get questions from JSON files
  getQuestionsFromJSON: async (phaseId) => {
    return apiCall(`/questions/json/phase/${phaseId}`);
  },

  // Start a new quiz (get random questions from database)
  startQuiz: async (phaseId, limit = 10) => {
    return apiCall(`/quiz/start/${phaseId}?limit=${limit}`);
  },

  // Submit quiz answers (database questions)
  submitQuiz: async (phaseId, answers, timeSpent) => {
    return apiCall('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({
        phaseId,
        answers, // [{ questionId: 1, userAnswer: 'a' }, ...]
        timeSpent,
      }),
    });
  },

  // Submit quiz with JSON questions
  submitQuizJSON: async (phaseId, answers, timeSpent) => {
    return apiCall('/quiz/submit-json', {
      method: 'POST',
      body: JSON.stringify({
        phaseId,
        answers, // [{ questionId: 1, userAnswer: 'Option text' }, ...]
        timeSpent,
      }),
    });
  },
};

 
export const userAPI = {
  // Get quiz attempt history
  getHistory: async () => {
    return apiCall('/user/history');
  },

  // Get progress by phase
  getProgress: async () => {
    return apiCall('/user/progress');
  },

  // Get overall statistics
  getStats: async () => {
    return apiCall('/user/stats');
  },

  // Get flashcards grouped by phase for current user
  getFlashcards: async () => {
    return apiCall('/user/flashcards');
  },

  // Remove a specific flashcard
  removeFlashcard: async (phaseId, questionId) => {
    return apiCall('/user/flashcards/remove', {
      method: 'POST',
      body: JSON.stringify({ phaseId, questionId }),
    });
  },

  // Get last grades per phase
  getLastGrades: async () => {
    return apiCall('/user/last-grades');
  }
};

