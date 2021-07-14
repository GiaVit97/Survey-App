'use strict';
const db = require('./db');

/**
 *
 * @param {*} answer : an array of objects that contains all the answers and the surveyid. All answer also contain the questionid which it belongs
 * @returns the id of the unauthenticated user that answers to the question
 */
exports.createAnswer = answer => {
	return new Promise((resolve, reject) => {
		const userSQL = 'INSERT INTO answers(name, surveyid) VALUES(?,?)';
		const answerSQL = 'INSERT INTO singleanswers(surveyid, questionid, answer, answerid) VALUES(?,?,?,?)';
		const surveySQL = 'UPDATE surveys SET answers=answers+1 WHERE id = ?';
		let userID;

		db.run(userSQL, [answer.username, answer.surveyId], function (err) {
			if (err) {
				console.error(err);
				reject(err);
				return;
			}
			userID = this.lastID;

			db.run(surveySQL, [answer.surveyId], function (err) {
				if (err) {
					console.error(err);
					reject(err);
					return;
				}
			});

			if (userID != null) {
				answer.answers.forEach(singleAnswer => {
					if (singleAnswer.open && singleAnswer.answer && singleAnswer.answer !== '') {
						db.run(answerSQL, [answer.surveyId, singleAnswer.questionId, singleAnswer.answer, userID], function (err) {
							if (err) {
								console.error(err);
								reject(err);
								return;
							}
						});
					} else if (!singleAnswer.open && singleAnswer.answer) {
						singleAnswer.answer.forEach(closedAnswer => {
							db.run(answerSQL, [answer.surveyId, singleAnswer.questionId, closedAnswer.id, userID], function (err) {
								if (err) {
									console.error(err);
									reject(err);
									return;
								}
							});
						});
					}
				});
				resolve(userID);
			}
		});
	});
};

/**
 *
 * @param {*} surveyId : id of the requested survey's answers
 * @returns : an array of objects that contains in usernameList all the unauthenticated users that answer to the survey and in answers all their answers
 */
exports.getAnswers = surveyId => {
	const p1 = new Promise((resolve, reject) => {
		const answersSQL = 'SELECT * FROM singleanswers WHERE surveyid = ?';

		db.all(answersSQL, [surveyId], (err, rows) => {
			if (err) {
				reject(err);
				return;
			}
			const answers = rows.map(answer => ({
				id: answer.id,
				questionId: answer.questionid,
				answer: answer.answer,
				userId: answer.answerid,
			}));
			resolve(answers);
		});
	});

	const p2 = new Promise((resolve, reject) => {
		const userNameSQL = 'SELECT * FROM answers WHERE surveyid = ?';

		db.all(userNameSQL, [surveyId], (err, rows) => {
			if (err) {
				reject(err);
				return;
			}
			const userNames = rows.map(username => ({
				id: username.id,
				name: username.name,
			}));

			resolve(userNames);
		});
	});
	return Promise.all([p1, p2]).then(values => {
		return { usernameList: [...values[1]], answers: [...values[0]] };
	});
};
