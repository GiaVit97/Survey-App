import React, { useState, useEffect } from 'react';
import { Form, Badge, Button, Col, Row, Spinner } from 'react-bootstrap';
import { Redirect } from 'react-router-dom';
import ErrorMessage from './ErrorMessage';

/**
 *
 * @param {*} props.survey : this is the survey I want to show to the user
 * @param {*} props.saveAnswer : when the unauthenticated user filled the answers correctly, I call this function to save them on DB
 * @param {*} props.loggedIn : if the user is logged in he can't send answer to the survey and can see all the answers send by unauthenticated users. On the other hand, an unauthenticated user can send an answer for the survey
 * @param {*} props.surveyId : this is the id of the selected survey, the same I found on the url
 * @param {*} props.getSingleSurvey : when I call this function, I retrieve the single survey from the DB
 * @param {*} props.answers : this is the list of all answers. If the user is logged in it contains the answers from the unauthenticated users, else it is empty
 *
 */
export default function Survey(props) {
	const [userName, setUserName] = useState(''); // name that the unauthenticated user insert into the "insert your name" field
	const [userId, setUserId] = useState(-1); // id of the unauthenticated user ; I need this to show the answers to an authenticated user
	const [answers, setAnswers] = useState([]); // list of all the answers that the unauthenticated user inserts
	const [errorMsg, setErrorMsg] = useState(''); // error message if there is any
	const [submitted, setSubmitted] = useState(false); // boolean that indicates if the form is submitted or not. If it is true, the user is redirected to homepage
	const [disabledForm, setDisabledForm] = useState(false); // booelan that indicates if the user is authenticated (true) or unauthenticated (false). I need this to disabled all the fields and checkboxes

	const [selectedUserAnswer, setSelectedUserAnswer] = useState([]); // object that represent the answer of a single user. It is empty if the user is unauthenticated

	// I call the getSingleSurvey function to load the survey
	useEffect(() => {
		props.getSingleSurvey(props.surveyId);
	});

	// I fill the answers state with some question field and check if the user is logged or not
	useEffect(() => {
		if (props.survey.questions) {
			// I need only some data that are inside the question in DB
			let startAnswersState = props.survey.questions.map(question => ({
				questionId: question.id,
				optional: question.optional,
				open: question.open,
				min: question.minanswers,
				max: question.maxanswers,
			}));
			setAnswers(startAnswersState);
		}

		if (props.loggedIn) {
			setDisabledForm(true);
		} else {
			setDisabledForm(false);
		}
	}, [props.survey, props.loggedIn]);

	// I empty all the state (in case some of them are with some data from previous surveys) and refill them if the user is authenticated (so, if I have the answers props not empty)
	useEffect(() => {
		setUserName('');
		setUserId(-1);
		setSelectedUserAnswer({});
		if (props.answers.answers && props.answers.usernameList && props.answers.usernameList.length > 0) {
			setUserName(props.answers.usernameList[0].name);
			setSelectedUserAnswer(props.answers.answers.filter(answer => props.answers.usernameList[0].id === answer.userId));
			setUserId(props.answers.usernameList[0].id);
		}
	}, [props.answers]);

	// For unauthenticated user when answer to a question
	const updateAnswer = (questionId, newAnswer) => {
		setAnswers(oldAnswers =>
			oldAnswers.map(answer => {
				if (answer.questionId === questionId) return { ...answer, answer: newAnswer };
				else return answer;
			})
		);
	};

	const cancelErrorMsg = () => {
		setErrorMsg('');
	};

	const validateResult = event => {
		event.preventDefault();
		let valid = true;

		answers.forEach(answer => {
			// If the question is mandatory I need to check if the user write an answer.
			if (!answer.optional) {
				if (answer.answer) {
					if (answer.open) {
						// The question is open-ended
						if (answer.answer === '') {
							// If the question is open-ended and mandatory the text shoudn't be empty
							valid = false;
							setErrorMsg('Compile correctly all the questions to send it');
						}
					} else {
						// The question is closed-answer
						if (answer.answer.length === 0) {
							//There isn't selected answer and the answer is mandatory
							valid = false;
							setErrorMsg('Compile correctly all the questions to send it');
						} else if (answer.answer.length < answer.min || answer.answer.length > answer.max) {
							// The user select less answers than the minimum number or more answers than the maximum number
							valid = false;
							setErrorMsg('Compile correctly all the questions to send it');
						}
					}
				} else {
					valid = false;
					setErrorMsg('Compile correctly all the questions to send it');
				}
			}
		});

		if (userName === '') {
			valid = false;
			setErrorMsg('Please insert your name');
		}

		if (valid) {
			setErrorMsg('');
			props.saveAnswer(userName, answers);
			setSubmitted(true);
		}
	};

	// With this function the authenticated user can see the previous user's answers clicking on the left arrow
	const goBack = () => {
		// Take the object that has the id of the selected user (the name is not unique, I can't use it)
		let selectedUser = props.answers.usernameList.filter(user => user.id === userId)[0];
		// Find the position in the array of the selected user
		let position = props.answers.usernameList.indexOf(selectedUser);
		// If the position is 0 it is the first element in the array, so the next element should be the last of the array (in this way the mechanism will be sequential)
		if (position === 0) position = props.answers.usernameList.length;
		// I save the id of the new user to visualize it and update the states
		let newUserID = props.answers.usernameList[position - 1].id;
		setSelectedUserAnswer(props.answers.answers.filter(answer => answer.userId === newUserID));
		setUserName(props.answers.usernameList.filter(user => user.id === newUserID)[0].name);
		setUserId(newUserID);
	};

	// With this function the authenticated user can see the forward user's answers clicking on the right arrow
	const goForward = () => {
		// Take the object that has the id of the selected user (the name is not unique, I can't use it)
		let selectedUser = props.answers.usernameList.filter(user => user.id === userId)[0];
		// Find the position in the array of the selected user
		let position = props.answers.usernameList.indexOf(selectedUser);
		// If the element is the last element in the array, the next element should be the first of the array (in this way the mechanism will be sequential)
		if (position === props.answers.usernameList.length - 1) position = -1;
		// I save the id of the new user to visualize it and update the states
		let newUserID = props.answers.usernameList[position + 1].id;
		setSelectedUserAnswer(props.answers.answers.filter(answer => answer.userId === newUserID));
		setUserName(props.answers.usernameList.filter(user => user.id === newUserID)[0].name);
		setUserId(newUserID);
	};

	if (submitted) return <Redirect to='/' />;
	else if (parseInt(props.surveyId) !== props.survey.id) return <Spinner animation='grow' />;
	else
		return (
			<div>
				<ErrorMessage errorMsg={errorMsg} cancelErrorMsg={cancelErrorMsg} />
				<h2>{props.survey.title}</h2>
				<br />
				{disabledForm && (
					<>
						<span className='font-italic'>Navigate through users with the arrows. Selected user: </span>
						<span className='font-italic'>
							{props.answers.usernameList &&
								props.answers.usernameList.indexOf(props.answers.usernameList.filter(user => user.id === userId)[0]) +
									1}
							/{props.answers.usernameList && props.answers.usernameList.length}
						</span>
						<Row className='mt-3'>
							<Col xl={2}>
								{props.answers.usernameList && props.answers.usernameList.length > 1 ? (
									<i className='fas fa-arrow-circle-left fa-2x ' onClick={goBack}></i>
								) : (
									<i className='fas fa-arrow-circle-left fa-2x opacity'></i>
								)}
							</Col>
							<Col xl={8}>
								<h5>{userName}</h5>
							</Col>
							<Col xl={2}>
								{props.answers.usernameList && props.answers.usernameList.length > 1 ? (
									<i className='fas fa-arrow-circle-right fa-2x ' onClick={goForward}></i>
								) : (
									<i className='fas fa-arrow-circle-right fa-2x opacity'></i>
								)}
							</Col>
						</Row>
					</>
				)}
				<Form className='alignLeft' onSubmit={validateResult}>
					{!disabledForm && (
						<Form.Group>
							<Form.Label column='lg'>
								Write your name
								<span className='badgeSize'>Mandatory question</span>
							</Form.Label>

							<Form.Control
								name='username'
								type='text'
								placeholder='Insert your name'
								value={userName}
								maxLength={50}
								onChange={ev => setUserName(ev.target.value)}
							/>
						</Form.Group>
					)}

					{props.survey.questions &&
						props.survey.questions.map(question =>
							question.open ? (
								<OpenQuestion
									key={question.position}
									question={question}
									updateAnswer={updateAnswer}
									disabledForm={disabledForm}
									selectedUserAnswer={selectedUserAnswer}
								/>
							) : (
								<ClosedQuestion
									key={question.position}
									question={question}
									updateAnswer={updateAnswer}
									disabledForm={disabledForm}
									selectedUserAnswer={selectedUserAnswer}
								/>
							)
						)}

					{!disabledForm && (
						<Button variant='outline-success' size='lg' className='alignRight mb-5' onClick={validateResult}>
							Send your answers
						</Button>
					)}
				</Form>
			</div>
		);
}

/**
 *
 * @param {*} props.question : question object to show
 * @param {*} props.updateAnswer : function to update the unauthenticated user answer to the open question
 * @param {*} props.disabledForm : boolean that is true if the authenticated user is seeing the users' answers, false if an unauthenticated user is answering to the question
 * @param {*} props.selectedUserAnswer : answer of the user to show to the authenticated user
 *
 */
function OpenQuestion(props) {
	const [answer, setAnswer] = useState('');
	const [errorMsg, setErrorMsg] = useState('');

	useEffect(() => {
		setAnswer('');
		setErrorMsg('');
		let unmounted = false;

		// only for authenticated user
		if (props.selectedUserAnswer.length > 0 && props.question && !unmounted) {
			let answer = props.selectedUserAnswer.filter(answer => answer.questionId === props.question.id)[0];

			// I do another if because sometimes the code enter in the first if with the old props. With this other control we avoid error
			if (answer !== undefined && !unmounted) setAnswer(answer.answer);

			return () => {
				// In this way I unmount the component on the cleanup, so I don't have memory leak or error
				// If I change survey or user fastly
				// Without that React gives error because I do setAnswer so update the state and then update immediately again with another value without unmount the first
				unmounted = true;
			};
		}
	}, [props.question, props.selectedUserAnswer]);

	const updateAnswer = value => {
		setAnswer(value);
		props.updateAnswer(props.question.id, value);
		if (value === '' && !props.question.optional) {
			setErrorMsg('Please, write an answer for the question');
		} else {
			setErrorMsg('');
		}
	};

	return (
		<>
			<QuestionError errorMsg={errorMsg} />
			<Form.Group>
				<Form.Label column='lg'>
					<Row>
						<Col xs={9}>
							{props.question.position + 1}. {props.question.title}
						</Col>
						<Col xs={3}>{!props.question.optional && <span className='badgeSize'>Mandatory question</span>}</Col>
					</Row>
				</Form.Label>

				<Form.Control
					as='textarea'
					type='text'
					placeholder={props.disabledForm ? '' : 'Insert your answer'}
					maxLength={200}
					rows={3}
					value={answer}
					disabled={props.disabledForm}
					onChange={ev => updateAnswer(ev.target.value)}
				/>

				<Form.Text className='text-muted'>You can insert maximum 200 characters</Form.Text>
			</Form.Group>
		</>
	);
}

/**
 *
 * @param {*} props.question : question object to show
 * @param {*} props.updateAnswer : function to update the unauthenticated user answer to the open question
 * @param {*} props.disabledForm : boolean that is true if the authenticated user is seeing the users' answers, false if an unauthenticated user is answering to the question
 * @param {*} props.selectedUserAnswer : answer of the user to show to the authenticated user
 *
 */
function ClosedQuestion(props) {
	const [answers, setAnswers] = useState([]);
	const [errorMsg, setErrorMsg] = useState('');

	useEffect(() => {
		// I clear the errorMsg state of the single question
		setErrorMsg('');

		// I take all answers and put the checked to false. I do this to avoid error on uncontrolled update on the checkboxes
		// Otherwise uncontrolled behaviour
		let answersToCheck = props.question.answers.map(answer => ({ ...answer, checked: false }));

		// If the user is authenticated, so if I have to show the answer of a user I enter in the if
		if (props.selectedUserAnswer.length > 0) {
			// I take all the answers that has the same id of the question. A closed answers could have more than one answer (one for any checked checkbox)
			let myAnswers = props.selectedUserAnswer.filter(answer => answer.questionId === props.question.id);

			// With a foreach I scroll all the myAnswers array and all the answersToCheck array and cross the result to find the answers that has checkbox to true
			myAnswers.forEach(answer =>
				answersToCheck.forEach(answerToCheck => {
					if (parseInt(answer.answer) === answerToCheck.id) {
						answerToCheck.checked = true;
					}
				})
			);
		}

		setAnswers(answersToCheck);
	}, [props.question, props.selectedUserAnswer]);

	const updateAnswer = (id, value) => {
		// I create another variable with the updated state, so I can also pass it to updateAnswer function;
		// state update is asynchronous, so if I pass the state to the function it isn't updated yet
		let newData = answers.map(answer => {
			if (answer.id === id) return { ...answer, checked: value };
			else return answer;
		});
		let checkedAnswers = newData.filter(answer => answer.checked);
		setAnswers(newData);
		props.updateAnswer(props.question.id, [...checkedAnswers]);

		// If there is some errors I show an error message
		if (!props.question.optional && checkedAnswers.length < props.question.minanswers) {
			setErrorMsg('Please select at least ' + props.question.minanswers);
		} else if (!props.question.optional && checkedAnswers.length > props.question.maxanswers) {
			setErrorMsg('Please select at most ' + props.question.maxanswers);
		} else {
			setErrorMsg('');
		}
	};

	return (
		<>
			<QuestionError errorMsg={errorMsg} />
			<Form.Group>
				<Form.Label column='lg'>
					{props.question.position + 1}. {props.question.title}
					{!props.question.optional && <span className='badgeSize'>Mandatory question</span>}
				</Form.Label>

				{answers.map(answer => (
					<Form.Check
						id={'answer-' + answer.id}
						name='answer'
						type='checkbox'
						custom
						disabled={props.disabledForm}
						label={answer.text}
						checked={answer.id ? answer.checked : false}
						onChange={ev => updateAnswer(answer.id, ev.target.checked)}
						key={answer.id}
					/>
				))}
				<Form.Text className='text-muted'>
					You have to pick {props.question.minanswers} choices at least and maximum {props.question.maxanswers} choices
				</Form.Text>
			</Form.Group>
		</>
	);
}

/**
 *
 * @param {*} props.errorMsg : error message to show
 *
 */
function QuestionError(props) {
	if (props.errorMsg)
		return (
			<Badge pill variant='danger'>
				<i className='fas fa-exclamation-circle'></i>
				<span className='ml-2'>{props.errorMsg}</span>
			</Badge>
		);
	else return null;
}
