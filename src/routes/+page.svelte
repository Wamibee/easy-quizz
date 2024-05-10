<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    const hasSlug = $page.url.searchParams.has('quizz');
	export let data;
	import db from '../db';

	let selectedQuizz = "";
	let quizzId = 0;
	let questionId = 0;
	let questions = [];
	let answers = {};
	let answerIsValid = true;
	let loading = true;

    if(hasSlug) selectedQuizz = $page.url.searchParams.get('quizz');

	async function getStep() {
		if(quizz && quizzId > 0) {
			// Check if questionId is already stored in localStorage
			const storedStep = await db.quizzStep.where("quizzId").equals(quizzId).first();

			if(storedStep && storedStep.questionId >= 0) {
				questionId = storedStep.questionId;
			} else {
				await db.quizzStep.add({
					quizzId,
					questionId
				});
			}

			loading = false;
		} else {
			loading = false;
		}
	}

	async function saveStep() {
		if(quizz && quizzId > 0) {
			// Check if questionId is already stored in localStorage
			const storedStep = await db.quizzStep.where({'quizzId': quizzId}).first();

			if(storedStep) {
				await db.quizzStep.update(storedStep.id, {
					'questionId': questionId
				});
			} else {
				await db.quizzStep.add({
					quizzId,
					questionId
				});
			}
		}
	}

	// Fonction pour revenir à l'étape précédente
	const previousStep = () => {
		if(questionId > 0) {
			questionId--;
		}
		saveStep();
	}

	// Fonction pour passer à l'étape suivante
	function nextStep() {
		if(questionId <= quizz.questions.length) {
			questionId++;
		}
		saveStep();
	}

	async function saveAnswer(){
		let answerValue = "";

		// Sauvegarder la réponse en fonction du numéro de la question et de la réponse fournie
		if(quizz.questions[questionId - 1].type === "text" || quizz.questions[questionId - 1].type === "url") {
			answerValue = document.querySelector("input").value;
		}

		// Si la question est de type choix radio, alors on récupère la valeur de l'input radio
		if(quizz.questions[questionId - 1].type === "radio") {
			answerValue = document.querySelector("input:checked").value;
		}
		
		if(answerValue) {
			// Sauvegarder la réponse
			// Si la question est de type texte ou url, alors on met un input
			answers[questionId] = answerValue;

			// Sauvegarder la réponse dans la base de données
			// Si une réponse est déjà définie on l'uplodate
			const storedAnswer = await db.quizzAnswers.where({'quizzId': quizzId, 'questionId': questionId}).first();
			if(storedAnswer) {
				await db.quizzAnswers.update(storedAnswer.id, {
					'answer': answers[questionId]
				});
			} else {
				await db.quizzAnswers.add({
					quizzId,
					questionId,
					answer: answers[questionId]
				});
			}

			// Passer à la question suivante
			nextStep();
		} else {
			answerIsValid = false;
		}
	}

	const quizz = data?.quizzes?.find(q => q.slug === selectedQuizz);
	if(quizz) quizzId = quizz.id;

	// Hook to run on component mount
    onMount(() => {
		getStep();
    });
</script>

<svelte:head>
	<title>Queazy</title>
</svelte:head>

<section>
	{#if !hasSlug || !quizz}
		<div class="not-found">
			<h1>
				Bienvenue sur Queazy
			</h1>
			<h2>Il semblerait que vous n'ayez pas de quizz valide sélectionné !</h2>
		</div>
	{:else}
		<div class="quizz-container">
			{#if loading}
				<div class="flex-container">
					<i class="gg-spinner-two"></i>
					<p>Chargement...</p>
				</div>
			{:else}
				{#if questionId === 0}
					<h1>{quizz.title}</h1>
					<p>{quizz.description}</p>
					<!-- Au clic sur bouton, alerte "ok" -->
					<button on:click={nextStep}>
						<i class="gg-arrow-right"></i>
						<span>Commencer</span>
					</button>
				{:else if questionId > 0 && questionId <= quizz.questions.length}
					<div class="quizz-header">
						<button class="secondary" on:click={previousStep}>
							<i class="gg-arrow-left"></i>
						</button>
						<span class="quizz-step">Question {questionId} / {quizz.questions.length}</span>
					</div>
					<h1>{quizz.questions[questionId - 1].title}</h1>
					<p>{quizz.questions[questionId - 1].description}</p>
					
					<!-- Si la question est de type texte ou url, alors on met un input -->
					{#if quizz.questions[questionId - 1].type === "text" || quizz.questions[questionId - 1].type === "url"}
						<input type="{quizz.questions[questionId - 1].type}" />
					{/if}

					<!-- Si la question est de type choix multiple, alors on met des boutons checkbox -->
					<!-- On gérera les checkbox plus tard -->

					<!-- Si la question est de type choix multiple, alors on met des boutons radio -->
					{#if quizz.questions[questionId - 1].type === "radio"}
						{#each quizz.questions[questionId - 1].answers as answer}
							<label>
								<input type="radio" name="answer" value={answer.id} />
								{answer.label}
							</label>
						{/each}
					{/if}

					{#if answerIsValid === false}
						<p class="error">Veuillez renseigner une réponse !</p>
					{/if}

					<button on:click={saveAnswer}>Valider</button>
				{:else}
					<h1>C'est fini !</h1>
					<p>Le quizz est enfin terminé, vous pouvez consulter le récapitulatif des résultats ci-dessous !</p>

					<button on:click={() => {
						if(confirm("Êtes-vous sûr de vouloir recommencer ?")) {
							db.quizzStep.clear();
							questionId = 0;
						}
					}}>Recommencer</button>

					<hr>

					<!-- Voir tous ses résultats -->
					
					<div class="results">
						{#each quizz.questions as question}
							<div class="question">
								<b>{question.title}</b>
								<p>{answers[question.id]}</p>
								<ul>
									{#each question.answers as answer}
										<li>{answer.label}</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</section>