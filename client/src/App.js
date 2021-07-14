import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import TopBar from './pages/TopBar';
import API from './api/API';
import Login from './pages/Login';
import Homepage from './pages/Homepage';
import LeftSideBar from './pages/LeftSideBar';
import CreateSurvey from './pages/CreateSurvey';
import Survey from './pages/Survey';
import ErrorMessage from './pages/ErrorMessage';

function App() {
	const [loggedIn, setLoggedIn] = useState(false); // at the beginning, no user is logged in
	const [firstTime, setFirstTime] = useState(true); // In this way, the first time we open the app (or when we realod a page), we have time to see if the user is really logged in or not and avoid strange behaviour
	const [message, setMessage] = useState(''); // welcome message
	const [username, setUsername] = useState(''); // username of the logged in user
	const [dirty, setDirty] = useState(true);
	const [surveys, setSurveys] = useState([]); // list of all surveys

	const [selectedSurveyId, setSelectedSurveyId] = useState(''); // id of the selected survey
	const [selectedSurvey, setSelectedSurvey] = useState({}); // selected survey to show

	const [answers, setAnswers] = useState({}); // list of all answers associated with a specific survey

	const [errorMsg, setErrorMsg] = useState(''); // represent the error message
	const [messageType, setMessageType] = useState('danger'); // represent the tipe of the errorMsg. It can be danger or succes

	useEffect(() => {
		if (dirty) {
			if (loggedIn) {
				//The user is logged in, so I retrieve all his surveys
				API.getUserSurveys()
					.then(surveys => {
						setDirty(false);
						setSurveys(surveys);
					})
					.catch(err => {
						setErrorMsg(err.err);
						setMessageType('danger');
					});
			} else {
				// I retrieve all surveys because there are no logged in users
				API.getAllSurveys()
					.then(surveys => {
						setDirty(false);
						setSurveys(surveys);
					})
					.catch(err => {
						setErrorMsg(err.err);
						setMessageType('danger');
					});
			}
		}
	}, [dirty, loggedIn, messageType]);

	useEffect(() => {
		// When the application starts, we check if a user is already logged in or not
		const checkAuth = async () => {
			try {
				// here you have the user info, if already logged in
				const user = await API.getUserInfo();
				setLoggedIn(true);
				setUsername(user.name);
				setFirstTime(false);
			} catch (err) {
				//The user is not authenticated
				console.error(err.error);
				setFirstTime(false);
			}
		};
		checkAuth();
	}, []);

	useEffect(() => {
		// With this useEffect we take from DB all the information about the selected survey. This useEffect will be activated only when selectedSurveyId or loggedIn states change
		if (selectedSurveyId) {
			API.getSingleSurvey(selectedSurveyId).then(survey => {
				setSelectedSurvey(survey);
			});
			if (loggedIn) {
				API.getAnswers(selectedSurveyId).then(answers => setAnswers(answers));
			}
		}
	}, [selectedSurveyId, loggedIn]);

	// This function is called when the user wants to login and press the login button
	const doLogIn = async credentials => {
		try {
			const user = await API.logIn(credentials);
			setMessage('');
			setLoggedIn(true);
			setSelectedSurvey({});
			setSelectedSurveyId('');
			setDirty(true);
			setUsername(user);
		} catch (err) {
			setMessage(err);
		}
	};

	// This function is called when the user want to logout and press the logout button
	const doLogOut = async () => {
		await API.logOut();
		setLoggedIn(false);
		// clean up everything
		setMessage('');
		setUsername('');
		setSurveys([]);
		setSelectedSurvey({});
		setSelectedSurveyId('');
		setAnswers({});
		// In this way, when the user logout I load all surveys
		setDirty(true);
	};

	// This function is called when a logged in user insert a new survey
	const addSurvey = (surveyTitle, questions) => {
		API.createSurvey(surveyTitle, questions)
			.then(() => {
				setDirty(true);
				setMessageType('success');
				// If the survey is inserted correctly, I show a feedback to the user
				setErrorMsg('Survey created with success');
			})
			.catch(err => {
				setErrorMsg(err.err);
				setMessageType('danger');
			});
	};

	const getSingleSurvey = surveyId => {
		// I call this function when I enter in Survey. I prefer not to download all the survey with their questions at the beginning, but download them once per time, when I need them
		setSelectedSurveyId(surveyId);
	};

	// This function is called when an unauthenticated user send an answer
	const saveAnswer = (username, answers) => {
		// After I add an answer, I have to download again all the surveys to have the updated number of answers
		API.saveAnswer(username, answers, selectedSurvey.id)
			.then(() => {
				setDirty(true);
				setMessageType('success');
				// If the answer is inserted correctly, I show a feedback to the user
				setErrorMsg('Answer saved with success');
			})
			.catch(err => {
				setErrorMsg(err.err);
				setMessageType('danger');
			});
	};

	// This function is called by the ErrorMessage component when the user click on the 'X' to close the error message
	const cancelErrorMsg = () => {
		setErrorMsg('');
	};

	return (
		<Router>
			<div className='App'>
				<TopBar loggedIn={loggedIn} doLogOut={doLogOut} />
				<Container fluid className='below-nav'>
					<ErrorMessage errorMsg={errorMsg} cancelErrorMsg={cancelErrorMsg} messageType={messageType} />
					{firstTime ? (
						<Spinner animation='grow' />
					) : (
						<Switch>
							<Route
								path='/login'
								render={() => (
									<>
										{loggedIn ? (
											<Redirect to='/' />
										) : (
											<Row className='vheight-100'>
												<Col sm={3} />
												<Col sm={6}>
													<Login login={doLogIn} errorMessage={message} />
												</Col>
												<Col sm={3} />
											</Row>
										)}
									</>
								)}
							/>
							<Route
								path='/create'
								render={() => (
									<>
										{loggedIn ? (
											<Row className='vheight-100'>
												<Col sm={4}>
													{dirty ? <Spinner animation='grow' /> : <LeftSideBar loggedIn={loggedIn} surveys={surveys} />}
												</Col>
												<Col sm={8}>
													<CreateSurvey addSurvey={addSurvey} />
												</Col>
											</Row>
										) : (
											<Redirect to='/' />
										)}
									</>
								)}
							/>
							<Route
								path='/survey/:surveyId'
								render={({ match }) => (
									<Row className='vheight-100'>
										<Col sm={4}>
											{dirty ? (
												<Spinner animation='grow' />
											) : (
												<LeftSideBar loggedIn={loggedIn} surveys={surveys} surveyId={selectedSurveyId} />
											)}
										</Col>
										<Col sm={8}>
											<Survey
												survey={selectedSurvey}
												saveAnswer={saveAnswer}
												loggedIn={loggedIn} // If a user is logged in he can't send answer to the survey and see all the answers
												surveyId={match.params.surveyId}
												getSingleSurvey={getSingleSurvey}
												answers={answers}
											/>
										</Col>
									</Row>
								)}
							/>
							<Route
								path='/'
								render={() => (
									<Row className='vheight-100'>
										<Col sm={4}>
											{dirty ? <Spinner animation='grow' /> : <LeftSideBar loggedIn={loggedIn} surveys={surveys} />}
										</Col>
										<Col sm={8}>
											<Homepage loggedIn={loggedIn} username={username} />
										</Col>
									</Row>
								)}
							/>
						</Switch>
					)}
				</Container>
			</div>
		</Router>
	);
}

export default App;
