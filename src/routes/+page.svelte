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

				let userAnswers = await db.quizzAnswers.where("quizzId").equals(quizzId).toArray();

				if(userAnswers.length > 0) {
					userAnswers.forEach(answer => {
						answers[answer.questionId] = answer.answer;
					});
				} else {
					answers = {};
					questionId = 0;
				}
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
			if(document.querySelector("input:checked")) {
				answerValue = document.querySelector("input:checked").value;
			} else {
				answerIsValid = false;
			}
		}

		// Si la question est de type choix radio, alors on récupère la valeur de l'input radio
		if(quizz.questions[questionId - 1].type === "checkbox") {
			if(document.querySelector("input:checked")) {
				for(let i = 0; i < document.querySelectorAll("input:checked").length; i++) {
					answerValue += document.querySelectorAll("input:checked")[i].value + ",";
				}
			} else {
				answerIsValid = false;
			}
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
			answerIsValid = true;
			nextStep();
		} else {
			answerIsValid = false;
		}
	}

	const quizz = data?.quizzes?.find(q => q.slug === selectedQuizz);
	if(quizz) quizzId = quizz.id;

	async function reset() {
		// Supprimer les réponses
		await db.quizzAnswers.where("quizzId").equals(quizzId).delete();

		// Supprimer l'étape
		await db.quizzStep.where("quizzId").equals(quizzId).delete();

		// Recharger la page
		location.reload();
	}

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
					<h1>{@html quizz.title}</h1>
					<p class="quizz-description">{@html quizz.description}</p>
					<hr>
					<button on:click={nextStep}>
						<i class="gg-arrow-right"></i>
						<span>C'est parti !</span>
					</button>
				{:else if questionId > 0 && questionId <= quizz.questions.length}
					<div class="quizz-header">
						<button class="secondary" on:click={previousStep}>
							<i class="gg-arrow-left"></i>
						</button>
						<span class="quizz-step">Question {questionId} / {quizz.questions.length}</span>
					</div>
					
					<h1 class="">Question #{questionId}</h1>
					<h2 class="">{@html quizz.questions[questionId - 1].title}</h2>
					{#if quizz.questions[questionId - 1].description}
						<p>{@html quizz.questions[questionId - 1].description}</p>
					{/if}

					{#if quizz.questions[questionId - 1].type === "checkbox"}
						<p class="italic">Choisissez une ou plusieurs réponses</p>
					{/if}

					{#if quizz.questions[questionId - 1].type === "radio"}
						<p class="italic">Choisissez une seule réponse</p>
					{/if}
					
					<div class="question-input-section">
						<!-- Si la question est de type texte ou url, alors on met un input -->
						{#if quizz.questions[questionId - 1].type === "text" || quizz.questions[questionId - 1].type === "url"}
							<input placeholder="Insérez une réponse" type="{quizz.questions[questionId - 1].type}" value="{answers[questionId] ? answers[questionId] : ''}" />
						{/if}

						<!-- Si la question est de type choix multiple, alors on met des boutons checkbox -->
						{#if quizz.questions[questionId - 1].type === "checkbox"}
							{#each quizz.questions[questionId - 1].answers as answer}
								<label class="input-checkbox">
									{#if answers[questionId] && answers[questionId].split(',').includes(answer.id.toString())}
										<input type="checkbox" name="answer" value={answer.id} checked />
									{:else}
										<input type="checkbox" name="answer" value={answer.id} />
									{/if}
									{answer.label}
								</label>
							{/each}
						{/if}

						<!-- Si la question est de type choix multiple, alors on met des boutons radio -->
						{#if quizz.questions[questionId - 1].type === "radio"}
							{#each quizz.questions[questionId - 1].answers as answer}
								<label class="input-radio">
									{#if answers[questionId] == answer.id}
										<input type="radio" name="answer" value={answer.id} checked />
									{:else}
										<input type="radio" name="answer" value={answer.id} />
									{/if}
									{answer.label}
								</label>
							{/each}
						{/if}
						
					</div>

					{#if answerIsValid === false}
						<p class="error">Veuillez renseigner une réponse !</p>
					{/if}

					<button on:click={saveAnswer}>Valider</button>
				{:else}
					<h1>Vous avez répondu à toutes les questions, bravo !</h1>
					<p>Le quizz est enfin terminé, vous pouvez consulter vos résultats ci-dessous !</p>

					<button on:click={reset}>Recommencer</button>

					<hr>

					<!-- Voir tous ses résultats -->
					
					<div class="results">
						{#each quizz.questions as question}
							<div class="question">
								<div>
									<b>Question #{question.id} : </b>
									<span class="italic">{@html question.title}</span>
								</div>
								<hr>
								<!-- Si c'était une question à choix, lister les choix et marqué celui choisi -->
								{#if question.answers.length > 0}
									{#each question.answers as answer}
										<li class="answer-option {answer.is_correct ? 'answer-valid' : 'answer-not-valid'} {answers[question.id] == answer.id ? 'selected-answer' : ''} {(question.type == "checkbox" && answers[question.id] && answers[question.id].split(',').includes(answer.id.toString())) ? 'selected-answer' : ''}">
											<div class="answer-line italic">
												{#if answer.is_correct}
													<i class="gg-check"></i>
												{:else}
													<i class="gg-close"></i>
												{/if}
												{answer.label}
												{#if question.type == "checkbox" && answers[question.id] && answers[question.id].split(',').includes(answer.id.toString())}
													&nbsp;&nbsp;(votre réponse)
												{/if}
												{#if question.type == "radio" && answers[question.id] == answer.id}
													&nbsp;&nbsp;(votre réponse)
												{/if}
											</div>
											{#if answer.explanation}
												<div class="answer-check-explanation">{answer.explanation}</div>
											{/if}
										</li>
									{/each}
								{:else}
									{#if answers[question.id] && new RegExp(question.regex_check, 'i').test(answers[question.id])}
										<div class="answer-check ok">
											<i class="gg-check"></i>
											<span>Bonne réponse</span>&nbsp;:&nbsp;<span class="italic">{answers[question.id]}</span>
										</div>
									{:else}
										<div class="answer-check not-ok">
											<i class="gg-close"></i>
											<span>Mauvaise réponse</span>&nbsp;:&nbsp;<span class="italic">{answers[question.id]}</span>
										</div>

										<p class='explanation'>La réponse attendue était : 
											<code>{question.regex_check.replace(/\\s\*/g, ' ').replace(/\\s\+/g, ' ').replace(/\\/g, '')}</code>
										</p>
									{/if}
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</section>