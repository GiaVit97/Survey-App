import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { Button, Form, Col, Row } from 'react-bootstrap';
import ErrorMessage from './ErrorMessage';

/**
 *
 * @param {*} addSurvey : I call this function when the user send the survey and the survey is filled correctly
 *
 */
export default function CreateSurvey(props) {
	const [surveyTitle, setSurveyTitle] = useState(''); // title of the survey that the user insert in the field
	const [errorMsg, setErrorMsg] = useState(''); // error message if any
	const [questions, setQuestions] = useState([
		{
			title: '',
			open: 1,
			optional: 1,
			answers: [{ title: '', position: 0 }],
			position: 0,
			min: 0,
			max: 1,
		},
	]); // question object. At the beginning there is only one question

	//  When I publish the survey I put this state to true and redirect user to homepage
	const [surveySend, setSurveySend] = useState(false);

	const updateSurveyTitle = value => {
		setSurveyTitle(value);
		if (value !== '') {
			setErrorMsg('');
		} else {
			setErrorMsg('Please insert a title for the survey');
		}
	};

	const addQuestion = () => {
		let position = -1;
		// Search the position of the last element of the list
		questions.forEach(question => {
			if (question.position > position) position = question.position;
			return position;
		});
		setQuestions(oldQuestions => [
			...oldQuestions,
			{
				title: '',
				open: 1,
				optional: 1,
				answers: [{ title: '', position: 0 }],
				position: position + 1,
				min: 0,
				max: 1,
			},
		]);
	};

	const deleteQuestion = questionToRemove => {
		let questionsLocal = [...questions];
		// First I remove the item with a filter
		questionsLocal = questionsLocal.filter(question => question.position !== questionToRemove.position);
		// Then I have to adjust all the question's position. If the question position is lower than questionToRemove is ok, else I have to change it in position-1
		questionsLocal = questionsLocal.map(question => {
			if (question.position < questionToRemove.position) {
				return question;
			} else {
				return { ...question, position: question.position - 1 };
			}
		});
		// At the end, I update the state
		setQuestions(questionsLocal);
	};

	// With this function I update the position value of the question (need it to save them in order in db) and swap their position in the state
	const moveItem = (position, direction) => {
		// I copy the state in a local variable
		if (position !== undefined) {
			let questionsLocal = [...questions];
			if (direction === 'up') {
				// I save the previous item and change its position
				let itemAbove = questionsLocal[position - 1];
				itemAbove.position = position;
				// Take my item and put it in a previous position
				questionsLocal[position - 1] = questionsLocal[position];
				questionsLocal[position - 1].position = position - 1;
				questionsLocal[position] = itemAbove;
			} else if (direction === 'down') {
				// I save the following item and change its position
				let itemBelow = questionsLocal[position + 1];
				itemBelow.position = position;
				// Take my item and put it in a following position
				questionsLocal[position + 1] = questionsLocal[position];
				questionsLocal[position + 1].position = position + 1;
				questionsLocal[position] = itemBelow;
			} else return;
			// Update the state with the new element
			setQuestions([...questionsLocal]);
		}
	};

	const updateQuestion = (position, newData) => {
		setQuestions(oldQuestions =>
			oldQuestions.map(question => {
				if (question.position === position) return { ...question, ...newData };
				else return question;
			})
		);
	};

	const addAnswer = questionPosition => {
		let questionToUpdate = questions.filter(question => question.position === questionPosition)[0];
		// I need the position only to delete them correctly
		// I need to find the position of the last answer to create the new one with position+1
		let position = -1;
		questionToUpdate.answers.forEach(answer => {
			if (answer.position > position) position = answer.position;
			return position;
		});
		setQuestions(oldQuestions =>
			oldQuestions.map(question => {
				if (question.position === questionPosition)
					return { ...question, answers: [...question.answers, { title: '', position: position + 1 }] };
				else return question;
			})
		);
	};

	const updateAnswer = (answerTitle, answerPosition, questionPosition) => {
		// I find the right question, then I update the correct answer and finally update the state with the new question object
		let questionToUpdate = questions.filter(question => question.position === questionPosition)[0];
		questionToUpdate.answers = questionToUpdate.answers.map(answer => {
			if (answer.position === answerPosition) return { ...answer, title: answerTitle };
			else return answer;
		});

		setQuestions(oldQuestions =>
			oldQuestions.map(question => {
				if (question.position === questionPosition) {
					return { ...questionToUpdate };
				} else return question;
			})
		);
	};

	const removeAnswer = (answerPosition, questionPosition) => {
		let questionToUpdate = questions.filter(question => question.position === questionPosition)[0];
		questionToUpdate.answers = questionToUpdate.answers.filter(answer => answer.position !== answerPosition);

		setQuestions(oldQuestions =>
			oldQuestions.map(question => {
				if (question.position === questionPosition) {
					return { ...questionToUpdate };
				} else return question;
			})
		);
	};

	const validateResult = event => {
		event.preventDefault();
		let valid = true;

		questions.forEach(question => {
			//I show one error per question at time
			if (question.title === '') {
				valid = false;
				setErrorMsg('All the questions need to have a title');
			} else if (!question.open && question.answers.length === 0) {
				valid = false;
				setErrorMsg('Please fix the error in the questions below');
			} else if (question.max > question.answers.length) {
				valid = false;
				setErrorMsg('Please fix the error in the questions below');
			} else if (question.min >= 0 && question.min >= 0 && question.min > question.max) {
				valid = false;
				setErrorMsg('Please fix the error in the questions below');
			} else if (question.min >= 0 && question.answers.length <= question.min) {
				valid = false;
				setErrorMsg('Please fix the error in the questions below');
			} else if (question.min < 0 || question.min === '') {
				valid = false;
				setErrorMsg('Please fix the error in the questions below');
			} else if (question.max < 1 || question.max === '') {
				valid = false;
				setErrorMsg('Please fix the error in the questions below');
			} else if (!question.open && question.answers.length > 0) {
				question.answers.forEach(answer => {
					if (answer.title === '') {
						valid = false;
						setErrorMsg('Please fix the error in the questions below');
					}
				});
			}
		});

		if (questions.length === 0) {
			valid = false;
			setErrorMsg('Please insert at least one question');
		}

		if (surveyTitle === '') {
			valid = false;
			setErrorMsg('Please insert a title for the survey');
		}

		if (valid) {
			setErrorMsg('');
			props.addSurvey(surveyTitle, questions);
			setSurveySend(true);
		}
	};

	const cancelErrorMsg = () => {
		setErrorMsg('');
	};

	if (surveySend) {
		return <Redirect to='/' />;
	} else
		return (
			<div className='alignLeft'>
				<ErrorMessage errorMsg={errorMsg} cancelErrorMsg={cancelErrorMsg} />
				<Row>
					<Col>
						<h1>New Survey</h1>
					</Col>

					<Col xs='auto'>
						<Button variant='outline-primary' onClick={addQuestion}>
							Add a question
						</Button>
					</Col>
				</Row>
				<p className='font-italic'>Note: Once you publish it, you can't modify it</p>
				<Form onSubmit={validateResult}>
					<Form.Group>
						<Form.Label>Title of survey</Form.Label>
						<Form.Control
							type='text'
							placeholder='Enter a title for the survey'
							value={surveyTitle}
							onChange={ev => updateSurveyTitle(ev.target.value)}
						/>
					</Form.Group>

					{questions.length > 0 ? (
						questions.map((question, key) => {
							return (
								<Question
									key={key}
									question={question}
									deleteQuestion={deleteQuestion}
									questionsLength={questions.length}
									moveItem={moveItem}
									updateQuestion={updateQuestion}
									addAnswer={addAnswer}
									updateAnswer={updateAnswer}
									removeAnswer={removeAnswer}
								/>
							);
						})
					) : (
						<p>There are no questions. Add a new question with the "Add a question" button</p>
					)}
					<Button variant='outline-success' size='lg' className='alignRight mb-5' onClick={validateResult}>
						Publish the survey
					</Button>
				</Form>
			</div>
		);
}

/**
 *
 * @param {*} props.question : the question to show
 * @param {*} props.deleteQuestion : function to delete a question
 * @param {*} props.questionsLength : length of the questions array. I used it to verify the position of a question inside the array (if a question is the last item)
 * @param {*} props.moveItem : function to move a question up or down inside the array
 * @param {*} props.updateQuestion : function to modify property of a question
 * @param {*} props.addAnswer : function to add a new answer (in closed-answer questions)
 * @param {*} props.updateAnswer : function to update an existing answer (in closed-answer questions)
 * @param {*} props.removeAnswer : function to remove an existing answer (in closed-answer questions)
 *
 */
function Question(props) {
	const [formData, setFormData] = useState({ ...props.question }); // object that contain the single question
	const [errorMsg, setErrorMsg] = useState(''); // error message if any

	useEffect(() => {
		setFormData({ ...props.question });

		if (props.question.title === '') {
			setErrorMsg('Please insert a text for the question');
		} else if (!props.question.open && props.question.answers.length === 0) {
			setErrorMsg('Please insert at least one answer');
		} else if (props.question.max > props.question.answers.length) {
			setErrorMsg("You can't have a maximum answers number greater that the number of answers");
		} else if (props.question.min >= 0 && props.question.max > 0 && props.question.min > props.question.max) {
			setErrorMsg('Minimum answers can not be greater than maximum answers');
		} else if (props.question.min >= 0 && props.question.answers.length <= props.question.min) {
			setErrorMsg('Minimum answers can not be greater or equal than the number of answers');
		} else if (props.question.min < 0 || props.question.min === '') {
			setErrorMsg('Minimum number of answers must be greater or equal than 0');
		} else if (props.question.max < 1 || props.question.max === '') {
			setErrorMsg('Maximum number of answers must be greater or equal than 1');
		} else if (!props.question.open && props.question.answers.length > 0) {
			// If I have a closed answer, it enters here all the time
			// So I insert a counter. If at the end of the forEach the counter still be 0, I remove the error
			let counter = 0;
			props.question.answers.forEach(answer => {
				if (answer.title === '') {
					setErrorMsg('Please insert a text for all the answers');
					counter++;
				}
			});
			if (counter === 0) setErrorMsg('');
		} else {
			setErrorMsg('');
		}
	}, [props.question]);

	const deleteQuestion = () => {
		props.deleteQuestion(props.question);
	};

	const goUp = () => {
		props.moveItem(props.question.position, 'up');
	};

	const goDown = () => {
		props.moveItem(props.question.position, 'down');
	};

	const updateField = (name, value) => {
		let newData;
		if (name === 'open' && value) {
			newData = {
				...formData,
				[name]: value,
				min: 0,
				max: 1,
				answers: [{ title: '', position: 0 }],
			};
			setErrorMsg('');
		} else {
			newData = { ...formData, [name]: value };
		}

		// I don't need to update the local state, because useEffect do it
		props.updateQuestion(props.question.position, newData);
	};

	const updateMinMax = value => {
		let newData;
		// If the min number of answers is 0, the question will be optional
		if (value.min === '0') {
			newData = { ...formData, optional: 1, min: value.min, max: value.max };
		} else {
			newData = { ...formData, optional: 0, min: value.min, max: value.max };
		}

		props.updateQuestion(props.question.position, newData);
	};

	const cancelErrorMsg = () => {
		setErrorMsg('');
	};
	return (
		<div className='borderQuestion'>
			<ErrorMessage errorMsg={errorMsg} cancelErrorMsg={cancelErrorMsg} />
			<Row>
				<Col>
					<Form.Row>
						<Form.Group as={Col}>
							<Form.Label>Question</Form.Label>
							<Form.Control
								name='title'
								type='text'
								placeholder='Enter a question'
								value={formData.title}
								onChange={ev => updateField(ev.target.name, ev.target.value)}
							/>
						</Form.Group>
						<Form.Group as={Col} xs='auto'>
							<Form.Label>Type</Form.Label>
							<Form.Control
								name='open'
								as='select'
								value={formData.open ? 'Open-ended' : 'Closed-answer'}
								onChange={ev => updateField(ev.target.name, ev.target.value === 'Open-ended' ? 1 : 0)}>
								<option>Open-ended</option>
								<option>Closed-answer</option>
							</Form.Control>
						</Form.Group>
					</Form.Row>
					{formData.open ? (
						<>
							<OpenEnded />
							<Row>
								<Col xs={4} md={3} xl={2}>
									<Form.Check
										id={'optional' + props.question.position}
										name='optional'
										label='Optional'
										custom
										checked={formData.optional}
										onChange={ev => updateField(ev.target.name, ev.target.checked ? 1 : 0)}
									/>
								</Col>
								<Col>
									<p className='font-italic'>If not checked, the question will be mandatory</p>
								</Col>
							</Row>
						</>
					) : (
						<ClosedAnswer
							question={props.question}
							updateMinMax={updateMinMax}
							addAnswer={props.addAnswer}
							updateAnswer={props.updateAnswer}
							removeAnswer={props.removeAnswer}
						/>
					)}

					<Button style={{ marginTop: '10pt' }} variant='outline-danger' onClick={deleteQuestion}>
						Delete question
					</Button>
				</Col>
				<Col xs='auto' className='align-self-center'>
					{formData.position === 0 ? (
						<i className='fas fa-chevron-circle-up fa-2x opacity' />
					) : (
						<i className='fas fa-chevron-circle-up fa-2x' onClick={goUp} />
					)}
					{formData.position === props.questionsLength - 1 ? (
						<i className='fas fa-chevron-circle-down fa-2x marginTop opacity' />
					) : (
						<i className='fas fa-chevron-circle-down fa-2x marginTop' onClick={goDown} />
					)}
				</Col>
			</Row>
		</div>
	);
}

/**
 *
 * It represent only a readOnly field that the authenticated user can see.
 * The purpose is to show the authenticated user what the question will look like when the survey is published.
 *
 */
function OpenEnded() {
	return (
		<Form.Group>
			<Form.Label>Answer</Form.Label>
			<Form.Control type='text' readOnly />
		</Form.Group>
	);
}

/**
 *
 * @param {*} props.question : the question to show
 * @param {*} props.updateMinMax : function to update values of min and max number of answers in the question array
 * @param {*} props.addAnswer : function to add a new answer (in closed-answer questions)
 * @param {*} props.updateAnswer : function to update an existing answer (in closed-answer questions)
 * @param {*} props.removeAnswer : function to remove an existing answer (in closed-answer questions)
 *
 */
function ClosedAnswer(props) {
	const [numberAnswers, setNumberAnswers] = useState({ min: props.question.min, max: props.question.max }); // state that represent min and max number of answers values

	useEffect(() => {
		setNumberAnswers({ min: props.question.min, max: props.question.max });
	}, [props.question]);

	const updateNumberAnswers = (name, value) => {
		const newData = { ...numberAnswers, [name]: value };
		props.updateMinMax(newData);
	};

	return (
		<div>
			<Form.Row>
				<Form.Group as={Col} md='6'>
					<Form.Label>Minimum number of answers</Form.Label>
					<Form.Control
						type='number'
						min='0'
						max='1000'
						id='min'
						name='min'
						value={numberAnswers.min}
						onChange={ev => updateNumberAnswers(ev.target.name, ev.target.value)}
					/>
					<Form.Text className='text-muted'>If the minimum number is 0, the question will be optional</Form.Text>
				</Form.Group>
				<Form.Group as={Col} md='6'>
					<Form.Label>Maximum number of answers</Form.Label>
					<Form.Control
						type='number'
						min='1'
						max='1000'
						id='max'
						name='max'
						value={numberAnswers.max}
						onChange={ev => updateNumberAnswers(ev.target.name, ev.target.value)}
					/>
				</Form.Group>
			</Form.Row>

			<Button
				variant='outline-primary'
				style={{ marginBottom: '1rem' }}
				onClick={() => props.addAnswer(props.question.position)}>
				Add an Answer
			</Button>

			{props.question.answers.map((answer, key) => (
				<Answer
					key={key}
					question={props.question}
					answer={answer}
					updateAnswer={props.updateAnswer}
					removeAnswer={props.removeAnswer}
				/>
			))}
		</div>
	);
}

/**
 *
 * @param {*} props.question : the question to show
 * @param {*} props.answer : the answer of a closed-answer question to show
 * @param {*} props.updateAnswer : function to update an existing answer (in closed-answer questions)
 * @param {*} props.removeAnswer : function to remove an existing answer (in closed-answer questions)
 *
 */
function Answer(props) {
	const [answerTitle, setAnswerTitle] = useState(props.answer.title); // state that represent the single answer of a closed answer question

	useEffect(() => {
		setAnswerTitle(props.answer.title);
	}, [props.answer]);

	const udpateTitle = value => {
		setAnswerTitle(value);
		props.updateAnswer(value, props.answer.position, props.question.position);
	};

	return (
		<Form.Row style={{ marginBottom: '0.5rem' }}>
			<Col xs='auto'>
				<Form.Check custom disabled type='checkbox' />
			</Col>
			<Col>
				<Form.Control
					type='text'
					maxLength={200}
					placeholder='Enter an answer'
					name='answerTitle'
					value={answerTitle}
					onChange={ev => udpateTitle(ev.target.value)}
				/>
			</Col>
			<Col xs='auto'>
				<Button
					variant='outline-danger'
					onClick={() => props.removeAnswer(props.answer.position, props.question.position)}>
					Remove Answer
				</Button>
			</Col>
		</Form.Row>
	);
}
