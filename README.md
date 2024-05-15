# Easy quizz platform 

Simple and quick-to-set-up project for self-hosted quizzes, with answers saved in browser storage.

This project is open for contributions, whether it's through raising issues, submitting pull requests, or suggesting improvements.

To deploy it for free, you can utilize Vercel and leverage their free database option.

## Quick summary of how the app works : 

- Quizzes are accessed via their slug, defined in the "quizz" parameter of the URL.
- Currently, all quiz, question, and answer creation is done directly in the database; there's no interface for that yet.
- Utilizes Dexie for storing user answers in browser storage.
- Usage of SCSS for the app's style.
- Prerender is disabled to allow ``$page.url.searchParams.get('quizz')``
- The project was built using ``@vercel/postgres`, Vercel's PostgreSQL package for serverless functions

## Database structure 

Table ``qe_quizz``, columns : 
- ``id`` : integer, primary key
- ``title`` : varchar, supports HTML
- ``description`` : varchar, nullable, supports HTML
- ``slug`` : varchar, used to access the quiz in url, should not contain special characters except "-", or spaces
- ``open`` : boolean, allows users to start the quizz or not (hides the "start" button)
- ``retry`` : boolean, allows users to re-start the quizz or not  (hides the "restart" button)
- ``lang`` : varchar, defines the interface language (like buttons text), supports "en" (default) or "fr"

Table ``qe_questions``, columns : 
- ``id`` : integer, primary key
- ``quizz_id`` : integer, foreign key referencing ``qe_quizz`` table
- ``title`` : varchar, supports  HTML
- ``description`` : varchar, nullable, used to add more informations or hints to the question, supports HTML
- ``type`` : varchar, supported types are "text", "url", "checkbox" and "radio"
- ``regex_check`` : varchar, nullable, used to check answers when type is "text" or "url"

Table ``qe_answers``, columns :  
- ``id`` : integer, primary key
- ``question_id`` : integer, foreign key referencing ``qe_questions`` table
- ``label`` : varchar, label of the answer
- ``is_correct`` : boolean, defines if the answer is correct of not
- ``explanation`` : varchar, nullable, provides indication to help the user understand why the answer is correct or not

## Developing

To launch the project for the first time, remember to run ``npm install`` and create the database with its tables. Additionally, create an ``.env`` file and set up your paths for database information.

To start coding for the project, use npm run dev.

## Building

To create a production version : ``npm run build``.

You can preview the production build with `npm run preview`.

## Screenshots 

![image](https://github.com/Wamibee/easy-quizz/assets/54935766/1c55a1c9-73b5-41fb-a52a-09c17079dfe1)

![image](https://github.com/Wamibee/easy-quizz/assets/54935766/a3a35be7-4b14-46de-87c2-6406179836d4)

![image](https://github.com/Wamibee/easy-quizz/assets/54935766/daa2ff19-3b2c-43c2-9316-7cc250eb73ab)



