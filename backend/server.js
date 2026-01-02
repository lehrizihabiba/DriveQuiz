/* eslint-disable no-undef */
 
import express from 'express';
import cors from 'cors';
import sqlite3Package from 'sqlite3';
const sqlite3 = sqlite3Package.verbose();
import bcrypt from 'bcryptjs';
import session from 'express-session';
import path from 'path';

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS - allow explicit FRONTEND_URL or any localhost/127.0.0.1 origin (any port) in dev
const explicitFrontend = process.env.FRONTEND_URL;
const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin: (origin, cb) => {
    // allow non-browser tools like curl (no origin)
    if (!origin) return cb(null, true);

    // allow explicit frontend origin if provided
    if (explicitFrontend && origin === explicitFrontend) return cb(null, true);

    // allow any localhost or 127.0.0.1 origin (any port)
    if (localhostRegex.test(origin)) return cb(null, true);

    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static('public')); // Serve images from public folder

// Session configuration
app.use(session({
  secret: 'drivequiz-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Database connection
const db = new sqlite3.Database('./drivequiz.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log(' Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Create tables (runs from schema.sql or inline)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      date_of_birth DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase_id INTEGER NOT NULL CHECK(phase_id >= 1 AND phase_id <= 6),
      question TEXT NOT NULL,
      choice_a TEXT NOT NULL,
      choice_b TEXT NOT NULL,
      choice_c TEXT NOT NULL,
      choice_d TEXT,
      correct_answer TEXT NOT NULL,
      image TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phase_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      time_spent INTEGER,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phase_id INTEGER NOT NULL,
      completed BOOLEAN DEFAULT 0,
      best_score INTEGER DEFAULT 0,
      attempts_count INTEGER DEFAULT 0,
      last_attempt_at TIMESTAMP,
      UNIQUE(user_id, phase_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phase_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      user_wrong_answer TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, phase_id, question_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Database tables initialized');
}
 
// Register new user
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password, fullName, phone, dateOfBirth } = req.body;

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into database
    db.run(
      `INSERT INTO users (username, email, password_hash, full_name, phone, date_of_birth) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, fullName, phone, dateOfBirth],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        // Create session
        req.session.userId = this.lastID;
        req.session.username = username;

        res.status(201).json({
          message: 'User created successfully',
          user: { id: this.lastID, username, email, fullName }
        });
      }
    );
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name
      }
    });
  });
});

// Logout user
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.get('SELECT id, username, email, full_name, phone FROM users WHERE id = ?', 
    [req.session.userId], 
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    }
  );
});

 
// Get questions by phase
app.get('/api/questions/phase/:phaseId', (req, res) => {
  const phaseId = parseInt(req.params.phaseId);

  if (phaseId < 1 || phaseId > 6) {
    return res.status(400).json({ error: 'Invalid phase ID' });
  }

  db.all(
    'SELECT id, phase_id, question, choice_a, choice_b, choice_c, choice_d, image FROM questions WHERE phase_id = ?',
    [phaseId],
    (err, questions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Format questions to match your schema
      const formattedQuestions = questions.map(q => ({
        id: q.id,
        phase_id: q.phase_id,
        question: q.question,
        choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d].filter(c => c),
        image: q.image
        // Note: We don't send correct_answer to frontend for security
      }));

      res.json({ questions: formattedQuestions });
    }
  );
});

// Get random questions for a quiz (e.g., 10 questions)
app.get('/api/quiz/start/:phaseId', (req, res) => {
  const phaseId = parseInt(req.params.phaseId);
  const limit = parseInt(req.query.limit) || 10;

  db.all(
    `SELECT id, phase_id, question, choice_a, choice_b, choice_c, choice_d, image 
     FROM questions 
     WHERE phase_id = ? 
     ORDER BY RANDOM() 
     LIMIT ?`,
    [phaseId, limit],
    (err, questions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedQuestions = questions.map(q => ({
        id: q.id,
        phase_id: q.phase_id,
        question: q.question,
        choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d].filter(c => c),
        image: q.image
      }));

      res.json({ questions: formattedQuestions });
    }
  );
});

// Submit quiz and get results
app.post('/api/quiz/submit', (req, res) => {
  const { phaseId, answers, timeSpent } = req.body;
  // answers format: [{ questionId: 1, userAnswer: 'a' }, ...]

  // Get correct answers and question text for submitted questions
  const questionIds = answers.map(a => a.questionId);
  if (questionIds.length === 0) {
    return res.status(400).json({ error: 'No answers submitted' });
  }
  const placeholders = questionIds.map(() => '?').join(',');

  db.all(
    `SELECT id, correct_answer, question FROM questions WHERE id IN (${placeholders})`,
    questionIds,
    (err, correctAnswers) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      // Build maps for quick lookup
      const answerMap = new Map(correctAnswers.map(q => [q.id, { correct: q.correct_answer, question: q.question }]));

      // Calculate score. If user is authenticated, manage flashcards and save attempt.
      let score = 0;
      const results = [];

      answers.forEach(a => {
        const meta = answerMap.get(a.questionId) || {};
        const correctAns = meta.correct;
        const questionText = meta.question || '';
        const isCorrect = correctAns === a.userAnswer;
        if (isCorrect) {
          score++;
          // If authenticated, remove flashcard
          if (req.session.userId) removeFlashcard(req.session.userId, phaseId, a.questionId);
        } else {
          // If authenticated, add to flashcards
          if (req.session.userId) addFlashcard(req.session.userId, phaseId, a.questionId, questionText, correctAns, a.userAnswer);
        }

        results.push({
          questionId: a.questionId,
          userAnswer: a.userAnswer,
          correctAnswer: correctAns,
          isCorrect
        });
      });

      // If authenticated, save quiz attempt and update progress
      if (req.session.userId) {
        db.run(
          `INSERT INTO quiz_attempts (user_id, phase_id, score, total_questions, time_spent) 
           VALUES (?, ?, ?, ?, ?)`,
          [req.session.userId, phaseId, score, answers.length, timeSpent],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Could not save attempt' });
            }

            // Update user progress
            updateUserProgress(req.session.userId, phaseId, score, answers.length);

            res.json({
              score,
              totalQuestions: answers.length,
              percentage: Math.round((score / answers.length) * 100),
              results
            });
          }
        );
      } else {
        // Guest: just return results without saving
        res.json({
          score,
          totalQuestions: answers.length,
          percentage: Math.round((score / answers.length) * 100),
          results
        });
      }
    }
  );
});

// Helper function to update user progress
function updateUserProgress(userId, phaseId, score, totalQuestions) {
  db.get(
    'SELECT * FROM user_progress WHERE user_id = ? AND phase_id = ?',
    [userId, phaseId],
    (err, progress) => {
      if (err) return;

      if (progress) {
        // Update existing progress
        const newBestScore = Math.max(progress.best_score, score);
        db.run(
          `UPDATE user_progress 
           SET attempts_count = attempts_count + 1,
               best_score = ?,
               completed = ?,
               last_attempt_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND phase_id = ?`,
          [newBestScore, score === totalQuestions ? 1 : progress.completed, userId, phaseId]
        );
      } else {
        // Create new progress entry
        db.run(
          `INSERT INTO user_progress (user_id, phase_id, best_score, attempts_count, completed, last_attempt_at)
           VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP)`,
          [userId, phaseId, score, score === totalQuestions ? 1 : 0]
        );
      }
    }
  );
}

// Add a flashcard for a user (idempotent)
function addFlashcard(userId, phaseId, questionId, questionText, correctAnswer, userWrongAnswer) {
  if (!userId || !questionId) return;
  db.run(
    `INSERT OR IGNORE INTO flashcards (user_id, phase_id, question_id, question_text, correct_answer, user_wrong_answer)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, phaseId, questionId, questionText || '', correctAnswer || '', userWrongAnswer || ''],
    (err) => {
      if (err) console.error('Error adding flashcard:', err.message);
    }
  );
}

// Remove a flashcard when user answers correctly
function removeFlashcard(userId, phaseId, questionId) {
  if (!userId || !questionId) return;
  db.run(
    `DELETE FROM flashcards WHERE user_id = ? AND phase_id = ? AND question_id = ?`,
    [userId, phaseId, questionId],
    (err) => {
      if (err) console.error('Error removing flashcard:', err.message);
    }
  );
}

// Get user's flashcards grouped by phase
app.get('/api/user/flashcards', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  db.all(
    `SELECT f.id, f.phase_id, f.question_id, f.question_text, f.correct_answer, f.user_wrong_answer, f.created_at, COALESCE(q.image, '') as image
     FROM flashcards f
     LEFT JOIN questions q ON f.question_id = q.id
     WHERE f.user_id = ?
     ORDER BY f.phase_id, f.created_at DESC`,
    [req.session.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      // Group by phase
      const grouped = {};
      rows.forEach(r => {
        if (!grouped[r.phase_id]) grouped[r.phase_id] = [];
        grouped[r.phase_id].push(r);
      });

      res.json({ flashcards: grouped });
    }
  );
});

// Remove a single flashcard (user action)
app.post('/api/user/flashcards/remove', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { phaseId, questionId } = req.body;
  if (!phaseId || !questionId) return res.status(400).json({ error: 'Missing parameters' });

  if (!sqliteAvailable) {
    const before = fallbackDB.flashcards.length;
    fallbackDB.flashcards = fallbackDB.flashcards.filter(f => !(f.user_id === req.session.userId && f.phase_id === phaseId && f.question_id === questionId));
    saveFallbackDB();
    return res.json({ removed: before - fallbackDB.flashcards.length });
  }

  db.run(
    `DELETE FROM flashcards WHERE user_id = ? AND phase_id = ? AND question_id = ?`,
    [req.session.userId, phaseId, questionId],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ removed: this.changes });
    }
  );
});

// Get last grade per phase for the user
app.get('/api/user/last-grades', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  // For each phase, get the latest attempt
  db.all(
    `SELECT qa.phase_id, qa.score, qa.total_questions, qa.completed_at
     FROM quiz_attempts qa
     JOIN (
       SELECT phase_id, MAX(completed_at) AS last_time
       FROM quiz_attempts
       WHERE user_id = ?
       GROUP BY phase_id
     ) lasts ON qa.phase_id = lasts.phase_id AND qa.completed_at = lasts.last_time
     WHERE qa.user_id = ?
     ORDER BY qa.phase_id`,
    [req.session.userId, req.session.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ lastGrades: rows });
    }
  );
});

 
// Get user's quiz history
app.get('/api/user/history', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.all(
    `SELECT * FROM quiz_attempts 
     WHERE user_id = ? 
     ORDER BY completed_at DESC 
     LIMIT 50`,
    [req.session.userId],
    (err, attempts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ history: attempts });
    }
  );
});

// Get user's progress by phase
app.get('/api/user/progress', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.all(
    'SELECT * FROM user_progress WHERE user_id = ? ORDER BY phase_id',
    [req.session.userId],
    (err, progress) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ progress });
    }
  );
});

// Get user statistics
app.get('/api/user/stats', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.get(
    `SELECT 
      COUNT(*) as total_attempts,
      AVG(score * 1.0 / total_questions * 100) as average_score,
      MAX(score * 1.0 / total_questions * 100) as best_score,
      SUM(time_spent) as total_time
     FROM quiz_attempts 
     WHERE user_id = ?`,
    [req.session.userId],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ stats });
    }
  );
});

// Start server with automatic port fallback (tries next ports if in use)
function startServer(port, maxAttempts = 50) {
  const server = app.listen(port, () => {
    console.log(` Server running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && maxAttempts > 0) {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      // wait briefly before retrying to avoid busy loop
      setTimeout(() => startServer(port + 1, maxAttempts - 1), 200);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });
}

startServer(Number(PORT), 100);

 
 

// Get questions from JSON file
app.get('/api/questions/json/phase/:phaseId', (req, res) => {
  const phaseId = parseInt(req.params.phaseId);
  
  if (phaseId < 1 || phaseId > 6) {
    return res.status(400).json({ error: 'Invalid phase ID' });
  }

  const filePath = path.join(__dirname, 'data', `phase${phaseId}.json`);
  

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Question file not found' });
  }

  try {
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Don't send correct answers to frontend
    const questionsWithoutAnswers = questions.map(q => ({
      id: q.id,
      phase_id: q.phase_id,
      question: q.question,
      choices: q.choices,
      image: q.image
    }));

    res.json({ questions: questionsWithoutAnswers });
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error reading question file' });
  }
});

// Submit quiz with JSON questions
app.post('/api/quiz/submit-json', (req, res) => {
  const { phaseId, answers, timeSpent } = req.body;
  
  // Load correct answers from JSON
  const filePath = path.join(__dirname, 'data', `phase${phaseId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Question file not found' });
  }

  try {
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Create map of question ID to correct answer
    const answerMap = new Map(questions.map(q => [q.id, q.correct_answer]));
    
    // Calculate score
    let score = 0;
    const results = answers.map(a => {
      const correctAnswer = answerMap.get(a.questionId);
      const isCorrect = correctAnswer === a.userAnswer;
      if (isCorrect) score++;

      return {
        questionId: a.questionId,
        userAnswer: a.userAnswer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect
      };
    });

    // If authenticated: save attempt and update flashcards/progress
    if (req.session.userId) {
      db.run(
        `INSERT INTO quiz_attempts (user_id, phase_id, score, total_questions, time_spent) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.session.userId, phaseId, score, answers.length, timeSpent],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Could not save attempt' });
          }
          // Update flashcards: add wrong answers, remove corrected ones
          results.forEach(r => {
            const question = questions.find(q => q.id === r.questionId) || {};
            if (r.isCorrect) {
              removeFlashcard(req.session.userId, phaseId, r.questionId);
            } else {
              addFlashcard(req.session.userId, phaseId, r.questionId, question.question || '', r.correctAnswer, r.userAnswer);
            }
          });

          // Update user progress
          updateUserProgress(req.session.userId, phaseId, score, answers.length);

          res.json({
            score,
            totalQuestions: answers.length,
            percentage: Math.round((score / answers.length) * 100),
            results
          });
        }
      );
    } else {
      // Guest: return results without persisting
      res.json({
        score,
        totalQuestions: answers.length,
        percentage: Math.round((score / answers.length) * 100),
        results
      });
    }
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error processing quiz submission' });
  }
});