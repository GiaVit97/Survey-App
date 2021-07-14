const express = require('express');
const morgan = require('morgan'); // logging middleware
const { check, validationResult, checkSchema } = require('express-validator'); // validation middleware
const passport = require('passport');
const passportLocal = require('passport-local');
const session = require('express-session'); // session middleware

const userDao = require('./userDao');
const surveyDao = require('./surveyDao');
const answerDao = require('./answerDao');

// initialize and configure passport
passport.use(
	new passportLocal.Strategy((username, password, done) => {
		// verification callback for authentication
		userDao
			.getUser(username, password)
			.then(user => {
				if (user) done(null, user);
				else done(null, false, { message: 'Wrong username and/or password' });
			})
			.catch(err => {
				done(err);
			});
	})
);

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
	done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
	userDao
		.getUserById(id)
		.then(user => {
			done(null, user); // this will be available in req.user
		})
		.catch(err => {
			done(err, null);
		});
});

// init express
const app = express();
const PORT = 3001;

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());

// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) return next();

	return res.status(401).json({ error: 'not authenticated' });
};

// initialize and configure HTTP sessions
app.use(
	session({
		secret: 'rgdfbdSWfd2sd3',
		resave: false,
		saveUninitialized: false,
	})
);

// tell passport to use session cookies
app.use(passport.initialize());
app.use(passport.session());

/*********************
		SURVEY DAO
**********************/

/**
 *
 * GET /api/surveys
 * Request parametera: none
 * Response body: an array of objects, each describing a survey (id, title and number of answers).
 * Errors: 'db erros
 * This API doesn't require authentication
 *
 */
app.get('/api/surveys', (req, res) => {
	surveyDao
		.listAllSurveys()
		.then(surveys => res.json(surveys))
		.catch(() => res.status(503).json({ error: `Database error during the fetch of the surveys.` }));
});

/**
 *
 * GET /api/usersurveys
 * Request parameters: id of the authenticated user
 * Response body: an array of objects, each describing a survey of the selected user (id, title and number of answers).
 * Errors: 'db errors'
 * This API require authentication
 *
 */
app.get('/api/usersurveys', isLoggedIn, (req, res) => {
	surveyDao
		.listUserSurveys(req.user.id)
		.then(surveys => res.json(surveys))
		.catch(() => res.status(503).json({ error: `Database error during the fetch of the surveys.` }));
});

/**
 *
 * GET /api/surveys/:surveyId
 * Request parameters: id of the selected survey
 * Response body: an object that contains all the questions of the selected survey.
 * Errors: 'db errors'
 * This API doens't require authentication
 *
 */
app.get('/api/surveys/:surveyId', async (req, res) => {
	try {
		const result = await surveyDao.getQuestions(req.params.surveyId);

		if (result.error) res.status(404).json(result);
		else res.json(result);
	} catch (err) {
		res.status(503).json({ error: `Database error during the fetch of the survey.` });
	}
});

/**
 *
 * POST /api/surveys
 * Request body content: information about the survey (the title and an array of objects with all the question.
 * 	                     The array contains for each object title,open,optional, min, max, position and
 *                       an array of objects with all the answer of a closed-answer that contains text for each answer).
 * Response body content: id of the added survey
 * Errors: if surveyTitle are empty, if questions isn't an array, if open, optional aren't boolean,
 * 		   if min and max aren't int, if position is empty and finally if answers of closed-questions (if there are) are empty
 *
 */

/*
 * nullable: if true, fields with null values will be considered optional
 * checkFalsy: if true, fields with falsy values (eg "", 0, false, null) will also be considered optional
 */
app.post(
	'/api/surveys',
	isLoggedIn,
	[
		check('surveyTitle', "Title of survey can't be empty").not().isEmpty(),
		check('questions', "Questions array can't be empty").isArray(),
		check('questions.*.title', "Question can't be empty").not().isEmpty(),
		check('questions.*.open', 'Open must be a boolean').isInt({ min: 0, max: 1 }),
		check('questions.*.optional', 'Optional must be a boolean').isInt({ min: 0, max: 1 }),
		check('questions.*.min', "MinAnswers can't be lower than 0").isInt({ min: 0 }),
		check('questions.*.max', "MaxAnswers can't be lower than 1").isInt({ min: 1 }),
		check('questions.*.position', 'Position cannot be empty').not().isEmpty(),
		check('questions.*.answers.*.title', "Answer can't be empty")
			.optional({ checkFalsy: true, nullable: true })
			.not()
			.isEmpty(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.error(errors.array());
			return res.status(422).json({ errors: errors.array() });
		}
		const survey = { surveyTitle: req.body.surveyTitle, questions: [...req.body.questions] };
		surveyDao
			.createSurvey(survey, req.user.id)
			.then(id => {
				res.status(201).json({ id: id });
			})
			.catch(err => {
				res.status(503).json({ error: `Database error during the creation of the survey ${survey.surveyTitle}` });
			});
	}
);

/*********************
		ANSWER DAO
**********************/

/**
 *
 * GET /api/answers/:surveyId
 * Request parameters: id of the survey
 * Response body content: an array of objects that contains all the information about unauthenticated users that answer to the survey and all their answers.
 * Errors: 'db errors'
 * This API require authentication
 */
app.get('/api/answers/:surveyId', isLoggedIn, async (req, res) => {
	try {
		const result = await answerDao.getAnswers(req.params.surveyId);

		if (result.error) res.status(404).json(result);
		else res.json(result);
	} catch (err) {
		res.status(503).json({ error: `Database error during the fetch of the answers.` });
	}
});

/**
 *
 * POST /api/answers
 * Request body content: information about the answers to the survey (username, surveyid and a list with all the answers. Each answers has questionId and text)
 * Response body content: id of the added answers
 * Errors: if username or surveyId are empty, if answers (if there are any) aren't array
 *
 */

/*
 * nullable: if true, fields with null values will be considered optional
 * checkFalsy: if true, fields with falsy values (eg "", 0, false, null) will also be considered optional
 */
app.post(
	'/api/answers',
	[
		check('username', "Username can't be empty").not().isEmpty(),
		check('surveyId', "SurveyID can't be empty").not().isEmpty(),
		check('answers', 'Answers is an array').isArray(),
		check('answers.*.answers', "Answer can't have more than 200 characters")
			.optional({ checkFalsy: true, nullable: true })
			.isLength({ min: 0, max: 200 }),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.error(errors.array());
			return res.status(422).json({ errors: errors.array() });
		}
		const answer = { username: req.body.username, surveyId: req.body.surveyId, answers: [...req.body.answers] };
		answerDao
			.createAnswer(answer)
			.then(id => {
				res.status(201).json({ id: id });
			})
			.catch(err => {
				res
					.status(503)
					.json({ error: `Database error during the creation of the answer for the survey ${answer.surveyId}` });
			});
	}
);

/*********************
		USER DAO
**********************/

// login
app.post('/api/sessions', function (req, res, next) {
	passport.authenticate('local', (err, user, info) => {
		if (err) return next(err);
		if (!user) {
			// display wrong login messages
			return res.status(401).json(info);
		}
		// success, perform the login
		req.login(user, err => {
			if (err) return next(err);

			// req.user contains the authenticated user, we send all the user info back
			// this is coming from userDao.getUser()
			return res.json(req.user);
		});
	})(req, res, next);
});

// logout
app.delete('/api/sessions/current', (req, res) => {
	req.logout();
	res.end();
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
	if (req.isAuthenticated()) {
		res.status(200).json(req.user);
	} else res.status(401).json({ error: 'Unauthenticated user!' });
});

// Activate the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));
