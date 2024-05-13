import Dexie from 'dexie';

const db = new Dexie('quizDB');

// Create a database schema

db.version(1.1).stores({
  quizzStep: '++id,&quizzId,questionId',
  quizzAnswers: '++id,[quizzId+questionId],*answers'
});

export default db;