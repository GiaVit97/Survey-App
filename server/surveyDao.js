'use strict';
const db = require('./db');

/**
 *
 * @returns the list of all surveys that are in db (id, name and number of answers of each survey)
 */
exports.listAllSurveys = () => {
	return new Promise((resolve, reject) => {
		const sql = 'SELECT * FROM surveys';
		db.all(sql, [], (err, rows) => {
			if (err) {
				reject(err);
				return;
			}
			const surveys = rows.map(survey => ({
				id: survey.id,
				title: survey.title,
				answers: survey.answers,
			}));
			resolve(surveys);
		});
	});
};

/**
 *
 * @param {*} userId : id of the authenticated user
 * @returns the list of all surveys that the authenticated user created (id, name and number of answers of each survey)
 */
exports.listUserSurveys = userId => {
	return new Promise((resolve, reject) => {
		const sql = 'SELECT * FROM surveys WHERE userid = ?';
		db.all(sql, [userId], (err, rows) => {
			if (err) {
				reject(err);
				return;
			}
			const surveys = rows.map(survey => ({
				id: survey.id,
				title: survey.title,
				answers: survey.answers,
			}));
			resolve(surveys);
		});
	});
};

/**
 *
 * @param {*} surveyId : id of the requested survey
 * @returns the list of all questions that are on the requested survey (for each open-ended question returns id, surveyid, title, open, optional, minanswers, maxanswers, position).
 * 			For each closed-question returns also the list of all possibile answers calling the getClosedAnswers function
 *
 */
exports.getQuestions = surveyId => {
	return new Promise((resolve, reject) => {
		const questionSQL = 'SELECT * FROM questions WHERE surveyid = ? ORDER BY position';
		const surveySQL = 'SELECT * FROM surveys WHERE id = ?';

		db.get(surveySQL, [surveyId], (err, row) => {
			if (err) {
				reject(err);
				return;
			}
			if (row == undefined) {
				resolve({ error: 'Survey not found' });
			} else {
				const survey = {
					id: row.id,
					title: row.title,
				};

				db.all(questionSQL, [surveyId], (err, rows) => {
					if (err) {
						reject(err);
						return;
					}

					let finalSurvey = rows.map(question => {
						if (!question.open) {
							return this.getClosedAnswers(question.id).then(answers => {
								return {
									id: question.id,
									surveyid: question.surveyid,
									title: question.title,
									open: question.open,
									optional: question.optional,
									minanswers: question.minanswers,
									maxanswers: question.maxanswers,
									position: question.position,
									answers: [...answers],
								};
							});
						} else
							return {
								id: question.id,
								title: question.title,
								open: question.open,
								optional: question.optional,
								minanswers: question.minanswers,
								maxanswers: question.maxanswers,
								position: question.position,
								answers: [],
							};
					});

					// In this way, I wait that all the promises inside finalSurvey are done (getClosedAnswer return a Promise), then send back the final obj with questions and answers
					Promise.all(finalSurvey)
						.then(res => resolve({ ...survey, questions: [...res] }))
						.catch(err => {
							console.error(err);
						});
				});
			}
		});
	});
};

/**
 *
 * @param {*} questionId : id of the question to which the answers belong
 * @returns the list of all the answers of the closed question (id and text of each answer)
 */
exports.getClosedAnswers = questionId => {
	return new Promise((resolve, reject) => {
		const sql = 'SELECT * FROM closedanswers WHERE questionid = ?';
		db.all(sql, [questionId], (err, rows) => {
			if (err) {
				reject(err);
				return;
			}

			const answers = rows.map(answer => ({
				id: answer.id,
				text: answer.text,
			}));

			resolve(answers);
		});
	});
};

/**
 *
 * @param {*} survey : array of objects that contains all questions, surveyid and title of the survey
 * @param {*} userId : id of the authenticated user that created the survey
 * @returns the id of the created survey into the surveys table
 */
exports.createSurvey = (survey, userId) => {
	return new Promise((resolve, reject) => {
		const surveySQL = 'INSERT INTO surveys(title, userid, answers) VALUES(?,?,?)';
		const questionSQL =
			'INSERT INTO questions(surveyid, title, open, optional, minanswers, maxanswers, position) VALUES(?,?,?,?,?,?,?)';
		const answerSQL = 'INSERT INTO closedanswers(questionid, text) VALUES(?,?)';
		let surveyID;
		let questionID;

		db.run(surveySQL, [survey.surveyTitle, userId, 0], function (err) {
			if (err) {
				console.error(err);
				reject(err);
				return;
			}
			surveyID = this.lastID;

			if (surveyID != null) {
				survey.questions.forEach(question => {
					db.run(
						questionSQL,
						[surveyID, question.title, question.open, question.optional, question.min, question.max, question.position],
						function (err) {
							if (err) {
								console.error(err);
								reject(err);
								return;
							}
							questionID = this.lastID;

							if (questionID != null && !question.open) {
								question.answers.forEach(answer => {
									db.run(answerSQL, [questionID, answer.title], function (err) {
										if (err) {
											console.error(err);
											reject(err);
											return;
										}
									});
								});
							}
						}
					);
				});
				resolve(surveyID);
			}
		});
	});
};
