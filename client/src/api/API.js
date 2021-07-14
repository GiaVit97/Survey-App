// All the API calls are defined here
const BASEURL = '/api';

/**
 * Function that takes credentials (email and password)
 * Call API: POST /sessions
 * Return an object with user information or an error
 *
 * @param {*} credentials : email and password of the user
 */
async function logIn(credentials) {
	let response = await fetch(BASEURL + '/sessions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(credentials),
	});
	if (response.ok) {
		const user = await response.json();
		return user.name;
	} else {
		try {
			const errDetail = await response.json();
			throw errDetail.message;
		} catch (err) {
			throw err;
		}
	}
}

/**
 * Function that logout the user
 * Call API: DELETE /session/current
 */
async function logOut() {
	await fetch(BASEURL + '/sessions/current', { method: 'DELETE' });
}

async function getUserInfo() {
	const response = await fetch(BASEURL + '/sessions/current');
	const userInfo = await response.json();
	if (response.ok) {
		return userInfo;
	} else {
		throw userInfo; // an object with the error coming from the server
	}
}

/* API FOR SURVEYS */

/**
 * Function that retrieve all the surveys inside DB
 * Return all surveys or an error
 * Call API: GET /surveys
 */
async function getAllSurveys() {
	return new Promise((resolve, reject) => {
		fetch(BASEURL + '/surveys', {
			method: 'GET',
		})
			.then(response => {
				if (response.ok) {
					response
						.json()
						.then(surveys => {
							resolve(surveys);
						})
						.catch(err => {
							reject({ err: 'Cannot parse server response.' });
						});
				} else {
					response
						.json()
						.then(obj => {
							reject(obj);
						})
						.catch(err => {
							reject({ err: 'Cannot parse server response.' });
						});
				}
			})
			.catch(err => {
				reject({ err: 'Cannot communicate with the server.' });
			});
	});
}

/**
 * Function that retrieve all the user's surveys inside DB
 * Return all the user's surveys or an error
 * Call API: GET /usersurveys
 */
async function getUserSurveys() {
	return new Promise((resolve, reject) => {
		fetch(BASEURL + '/usersurveys', {
			method: 'GET',
		})
			.then(response => {
				if (response.ok) {
					response
						.json()
						.then(surveys => {
							resolve(surveys);
						})
						.catch(err => {
							reject({ err: 'Cannot parse server response.' });
						});
				} else {
					response
						.json()
						.then(obj => {
							reject(obj);
						})
						.catch(err => {
							reject({ err: 'Cannot parse server response.' });
						});
				}
			})
			.catch(err => {
				reject({ err: 'Cannot communicate with the server.' });
			});
	});
}

/**
 * Function that add a new survey inside the DB
 * Call API: POST /surveys
 *
 * @param {*} surveyTitle
 * @param {*} questions
 */
function createSurvey(surveyTitle, questions) {
	return new Promise((resolve, reject) => {
		fetch(BASEURL + '/surveys', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ surveyTitle, questions: [...questions] }),
		})
			.then(response => {
				if (response.ok) {
					resolve(null);
				} else reject({ err: 'Cannot parse server response.' });
			})
			.catch(() => {
				reject({ err: 'Cannot communicate with the server.' });
			});
	});
}

/**
 * Function that retrieve a single survey with the surveyId passed
 * Return the selected survey or an error
 * Call API: GET /surveys/:surveyId
 *
 * @param {*} surveyId
 */
async function getSingleSurvey(surveyId) {
	return new Promise((resolve, reject) => {
		fetch(BASEURL + '/surveys/' + surveyId, {
			method: 'GET',
		})
			.then(response => {
				if (response.ok) {
					response
						.json()
						.then(survey => {
							resolve(survey);
						})
						.catch(err => {
							reject({ err: 'Cannot parse server response.' });
						});
				} else {
					response
						.json()
						.then(obj => {
							reject(obj);
						})
						.catch(err => {
							reject({ err: 'Cannot parse server response.' });
						});
				}
			})
			.catch(err => {
				reject({ err: 'Cannot communicate with the server.' });
			});
	});
}

/**
 * Function that add a new answer inside the DB
 * Call API: POST /answers
 *
 * @param {*} username
 * @param {*} answers
 * @param {*} surveyId
 */
async function saveAnswer(username, answers, surveyId) {
	return new Promise((resolve, reject) => {
		fetch(BASEURL + '/answers', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, surveyId: surveyId, answers: [...answers] }),
		})
			.then(response => {
				if (response.ok) {
					resolve(null);
				} else reject({ err: 'Cannot parse server response.' });
			})
			.catch(() => {
				reject({ err: 'Cannot communicate with the server.' });
			});
	});
}

/**
 * Function that retrieve all the answers of the selected survey
 * Retrun all the answers of the selected survey or an error
 * Call API: GET /answers/:surveyId
 *
 * @param {*} surveyId
 */
async function getAnswers(surveyId) {
	return new Promise((resolve, reject) => {
		fetch(BASEURL + '/answers/' + surveyId, {
			method: 'GET',
		})
			.then(response => {
				if (response.ok) {
					response
						.json()
						.then(answers => {
							resolve(answers);
						})
						.catch(err => {
							reject({ err: 'Cannot parse server response.' });
						});
				} else {
					response
						.json()
						.then(obj => {
							reject(obj);
						})
						.catch(err => {
							reject({ err: 'Cannot parse server response.' });
						});
				}
			})
			.catch(err => {
				reject({ err: 'Cannot communicate with the server.' });
			});
	});
}

const API = {
	logIn,
	logOut,
	getUserInfo,
	createSurvey,
	getAllSurveys,
	getUserSurveys,
	getSingleSurvey,
	saveAnswer,
	getAnswers,
};
export default API;
