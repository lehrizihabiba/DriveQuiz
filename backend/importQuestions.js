 import sqlite3Package from 'sqlite3';
 const sqlite3 = sqlite3Package.verbose();

import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
 

const db = new sqlite3.Database('./drivequiz.db');

// Function to import questions from JSON file
function importQuestionsFromJSON(phaseId) {
  const filePath = path.join(__dirname, 'data', `phase${phaseId}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  console.log(` Importing ${questions.length} questions for Phase ${phaseId}...`);

  questions.forEach((q, index) => {
    // Extract choices (pad with empty strings if less than 4)
    const choices = [...q.choices];
    while (choices.length < 4) {
      choices.push('');
    }

    db.run(
      `INSERT INTO questions (phase_id, question, choice_a, choice_b, choice_c, choice_d, correct_answer, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        phaseId,
        q.question,
        choices[0] || '',
        choices[1] || '',
        choices[2] || '',
        choices[3] || '',
        q.correct_answer,
        q.image || ''
      ],
      function(err) {
        if (err) {
          console.error(` Error inserting question ${index + 1}:`, err.message);
        }
      }
    );
  });

  console.log(` Phase ${phaseId} imported successfully!`);
}

// Import all phases
console.log(' Starting import process...\n');

// Clear existing questions (optional - remove if you want to keep existing data)
db.run('DELETE FROM questions', (err) => {
  if (err) {
    console.error('Error clearing questions:', err);
    return;
  }

  // Import all 6 phases
  for (let i = 1; i <= 6; i++) {
    importQuestionsFromJSON(i);
  }

  // Close database after a delay to ensure all inserts complete
  setTimeout(() => {
    db.close(() => {
      console.log('\n All questions imported successfully!');
      console.log(' Database ready to use!');
    });
  }, 1000);
});
