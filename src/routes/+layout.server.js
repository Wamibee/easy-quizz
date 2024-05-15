import { env } from '$env/dynamic/private';
import { createPool } from '@vercel/postgres';

export const prerender = false;

/** @type {import('./$types').LayoutServerLoad} */
export async function load() {
	const db = createPool({ connectionString: env.POSTGRES_URL });
	let storedStepQuizz = 0;

	try {
		const { rows: quizzes } = await db.query('SELECT * FROM qe_quizz ORDER BY id ASC');

		// On récupère le step du quizz du localstorage
		if (typeof localStorage !== 'undefined') {
			storedStepQuizz = localStorage.getItem('stepQuizz');
		}

		// Pour chaque quiz, on récupère les questions
		for (const quizz of quizzes) {
			const { rows: questions } = await db.query(
				'SELECT * FROM qe_questions WHERE quizz_id = ' + quizz.id +  ' ORDER BY id ASC'
			);

			// Pour chaque question, on récupère les réponses
			for (const question of questions) {
				const { rows: answers } = await db.query(
					'SELECT * FROM qe_answers WHERE question_id = ' + question.id + ' ORDER BY id ASC'
				);

				question.answers = answers;
			}

			quizz.questions = questions;
		}

		return {
			quizzes: quizzes,
			storedStepQuizz: storedStepQuizz
		};
	} catch (error) {
		throw error;
	}
}
