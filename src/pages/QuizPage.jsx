 import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { quizAPI } from '../services/api';
import '../assets/QuizPage.css';

function QuizPage({ setCurrentPage, phaseId = 1 }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use ref to avoid dependency issues
  const questionsRef = useRef([]);
  const answersRef = useRef([]);
  const currentIndexRef = useRef(0);
  const selectedAnswerRef = useRef(null);

  // Update refs when state changes
  useEffect(() => {
    questionsRef.current = questions;
    answersRef.current = answers;
    currentIndexRef.current = currentQuestionIndex;
    selectedAnswerRef.current = selectedAnswer;
  }, [questions, answers, currentQuestionIndex, selectedAnswer]);

  // Load questions from JSON via API
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await quizAPI.getQuestionsFromJSON(phaseId);
      
      if (response.questions && response.questions.length > 0) {
        // Shuffle and take first 10 questions
        const shuffled = [...response.questions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 10);
        
        setQuestions(selected);
        setQuizStartTime(Date.now());
      } else {
        setError('لا توجد أسئلة متاحة لهذه المرحلة');
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('فشل تحميل الأسئلة. تأكد من أن الخادم يعمل.');
    } finally {
      setLoading(false);
    }
  };

  // Load questions when component mounts
  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseId]);

  // Finish quiz and submit answers
  const finishQuiz = async (finalAnswers) => {
    setIsQuizComplete(true);
    
    const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000);

    try {
      const results = await quizAPI.submitQuizJSON(phaseId, finalAnswers, timeSpent);
      setQuizResults(results);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('فشل إرسال الإجابات');
    }
  };

  // Handle next question using refs
  const handleNextQuestionWithRefs = () => {
    const currentQuestion = questionsRef.current[currentIndexRef.current];
    const newAnswer = {
      questionId: currentQuestion.id,
      userAnswer: selectedAnswerRef.current || ''
    };

    const updatedAnswers = [...answersRef.current, newAnswer];
    setAnswers(updatedAnswers);

    if (currentIndexRef.current < questionsRef.current.length - 1) {
      setCurrentQuestionIndex(currentIndexRef.current + 1);
      setSelectedAnswer(null);
      setTimeLeft(20);
    } else {
      finishQuiz(updatedAnswers);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (questions.length === 0 || isQuizComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestionWithRefs();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questions.length, isQuizComplete]); // Only depend on length and completion status

  // Handle answer selection
  const handleAnswerSelect = (choice) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(choice);
  };

  // Handle next button click
  const handleNextQuestion = () => {
    handleNextQuestionWithRefs();
  };

  // Restart quiz
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setTimeLeft(30);
    setIsQuizComplete(false);
    setQuizResults(null);
    loadQuestions();
  };

  // Loading state
  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-loading">
          <div className="spinner"></div>
          <p>جاري تحميل الأسئلة...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="quiz-page">
        <button className="back-btn" onClick={() => setCurrentPage('tests')}>
          <ArrowLeft size={24} />
        </button>
        <div className="quiz-error">
          <p>{error}</p>
          <button className="btn-retry" onClick={loadQuestions}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }


  // Results screen
  if (isQuizComplete && quizResults) {
    return (
      <div className="quiz-page">
        <button className="back-btn" onClick={() => setCurrentPage('tests')}>
          <ArrowLeft size={24} />
        </button>
        
        <div className="quiz-results">
          <h1 className="results-title">نتائج الاختبار</h1>
          
          <div className="results-summary">
            <div className="result-circle">
              <div className="result-percentage">
                {quizResults.percentage}%
              </div>
              <div className="result-label">النسبة المئوية</div>
            </div>

            <div className="result-stats">
              <div className="stat">
                <CheckCircle size={32} className="icon-correct" />
                <span className="stat-value">{quizResults.score}</span>
                <span className="stat-label">إجابات صحيحة</span>
              </div>
              
              <div className="stat">
                <XCircle size={32} className="icon-incorrect" />
                <span className="stat-value">
                  {quizResults.totalQuestions - quizResults.score}
                </span>
                <span className="stat-label">إجابات خاطئة</span>
              </div>
            </div>
          </div>

          <div className="result-message">
            {quizResults.percentage >= 80 ? (
              <div className="message-success">
                <h2> ممتاز! لقد نجح</h2>
                <p>درجة رائعة! واصل التقدم</p>
              </div>
            ) : (
              <div className="message-fail">
                <h2>للأسف، لم تنجح هذه المرة</h2>
                <p>لا تستسلم! حاول مرة أخرى</p>
              </div>
            )}
          </div>

          <div className="detailed-results">
            <h3>التفاصيل</h3>
            {quizResults.results.map((result, index) => {
              const question = questions.find(q => q.id === result.questionId);
              return (
                <div 
                  key={index} 
                  className={`result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}
                >
                  <div className="result-header">
                    <span className="question-number">سؤال {index + 1}</span>
                    {result.isCorrect ? (
                      <CheckCircle size={20} className="icon-correct" />
                    ) : (
                      <XCircle size={20} className="icon-incorrect" />
                    )}
                  </div>
                  <p className="question-text">{question?.question}</p>
                  <div className="answer-details">
                    <p>إجابتك: <strong>{result.userAnswer || 'لم تجب'}</strong></p>
                    {!result.isCorrect && (
                      <p className="correct-answer">
                        الإجابة الصحيحة: <strong>{result.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="results-actions">
            <button className="btn-restart" onClick={handleRestartQuiz}>
              إعادة الاختبار
            </button>
            <button className="btn-home" onClick={() => setCurrentPage('tests')}>
              العودة للاختبارات
            </button>
            <button className="btn-profile" onClick={() => setCurrentPage('profile')}>
              عرض الملف الشخصي
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz interface
  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="quiz-page">
      <button className="back-btn" onClick={() => setCurrentPage('tests')}>
        <ArrowLeft size={24} />
      </button>

      <div className="quiz-container">
        <div className="quiz-progress">
          <div className="progress-text">
            السؤال {currentQuestionIndex + 1} من {questions.length}
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="quiz-timer">
          <Clock size={24} />
          <div className={`timer-circle ${timeLeft <= 10 ? 'warning' : ''}`}>
            {timeLeft}
          </div>
        </div>

        <div className="question-card">
          <p className="question-text">{currentQuestion.question}</p>
          {currentQuestion.image && currentQuestion.image !== '' && (
            <div className="question-image">
              <img 
                src={currentQuestion.image}
                alt="Question visual"
              />
            </div>
          )}
        </div>

        <div className="answers-grid">
          {currentQuestion.choices.map((choice, index) => (
            <button
              key={index}
              className={`answer-option ${
                selectedAnswer === choice ? 'selected' : ''
              }`}
              onClick={() => handleAnswerSelect(choice)}
              disabled={selectedAnswer !== null}
            >
              <span className="answer-letter">
                {String.fromCharCode(65 + index)}-
              </span>
              <span className="answer-text">{choice}</span>
            </button>
          ))}
        </div>

        <button 
          className="btn-next" 
          onClick={handleNextQuestion}
          disabled={selectedAnswer === null}
        >
          {currentQuestionIndex < questions.length - 1 ? 'التالي' : 'إنهاء الاختبار'}
        </button>
      </div>
    </div>
  );
}

export default QuizPage;