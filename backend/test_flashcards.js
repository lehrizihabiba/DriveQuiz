import http from 'http';
import fetch from 'node-fetch';

const BASE = 'http://localhost:5000/api';

async function signup() {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'tester1', email: 'tester1@example.com', password: 'Password123', fullName: 'مستخدم اختبار' })
  });
  const text = await res.text();
  const cookies = res.headers.raw()['set-cookie'] || [];
  return { status: res.status, body: text, cookie: cookies.map(c => c.split(';')[0]).join('; ') };
}

async function getQuestions(phase = 1) {
  const res = await fetch(`${BASE}/questions/json/phase/${phase}`);
  return res.json();
}

async function submitJson(answers, phase = 1, cookie) {
  const res = await fetch(`${BASE}/quiz/submit-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ phaseId: phase, answers, timeSpent: 120 })
  });
  return res.json();
}

async function getFlashcards(cookie) {
  const res = await fetch(`${BASE}/user/flashcards`, { headers: { Cookie: cookie } });
  return res.json();
}

async function removeFlashcard(phaseId, questionId, cookie) {
  const res = await fetch(`${BASE}/user/flashcards/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ phaseId, questionId })
  });
  return res.json();
}

async function run() {
  console.log('Signing up test user...');
  const s = await signup();
  console.log('Signup status', s.status);
  if (s.status !== 201 && s.status !== 200) {
    console.log('Signup response:', s.body);
    // If user already exists, try to login to get cookie
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tester1@example.com', password: 'Password123' })
    });
    const cookies = loginRes.headers.raw()['set-cookie'] || [];
    s.cookie = cookies.map(c => c.split(';')[0]).join('; ');
    console.log('Logged in, status', loginRes.status);
  }

  const cookie = s.cookie;
  if (!cookie) {
    console.error('No cookie available; aborting tests');
    process.exit(1);
  }

  console.log('Fetching questions for phase 1...');
  const q = await getQuestions(1);
  const questions = q.questions || [];
  console.log('Found', questions.length, 'questions');

  if (questions.length === 0) {
    console.error('No questions to test with; aborting');
    process.exit(1);
  }

  // Create wrong answers for all questions
  const wrongAnswers = questions.map(qq => ({ questionId: qq.id, userAnswer: 'WRONG_ANSWER' }));
  console.log('Submitting incorrect answers to generate flashcards...');
  const res1 = await submitJson(wrongAnswers, 1, cookie);
  console.log('Submit result:', res1.score, '/', res1.totalQuestions);

  console.log('Fetching flashcards...');
  const fc1 = await getFlashcards(cookie);
  console.log('Flashcards grouped keys:', Object.keys(fc1.flashcards || {}).join(', '));

  // Now resubmit with correct answers to remove flashcards
  const correctAnswers = questions.map(qq => ({ questionId: qq.id, userAnswer: (qq.correct_answer || qq.correctAnswer || '') }));
  console.log('Resubmitting correct answers to remove flashcards...');
  const res2 = await submitJson(correctAnswers, 1, cookie);
  console.log('Resubmit result:', res2.score, '/', res2.totalQuestions);

  console.log('Fetching flashcards after correction...');
  const fc2 = await getFlashcards(cookie);
  console.log('Flashcards grouped keys after correction:', Object.keys(fc2.flashcards || {}).join(', '));

  console.log('Test finished');
}

run().catch(err => { console.error('Test script error:', err); process.exit(1); });
