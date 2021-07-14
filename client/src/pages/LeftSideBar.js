import React from 'react';
import { Link } from 'react-router-dom';
import { ListGroup, Row, Col } from 'react-bootstrap';

/**
 *
 * @param {*} props.loggedIn : if the user is logged in, I show a different text above the surveys' list
 * @param {*} props.surveys : I show to the user (authenticated or not) the list of the surveys
 *
 */
export default function LeftSideBar(props) {
	return (
		<div>
			{props.loggedIn ? (
				<MySurveys surveys={props.surveys} surveyId={props.surveyId ? props.surveyId : null} />
			) : (
				<AllSurveys surveys={props.surveys} surveyId={props.surveyId ? props.surveyId : null} />
			)}
		</div>
	);
}

/**
 *
 * @param {*} props.surveys : list of all surveys to show to the unauthenticated user
 * @param {*} props.surveyId : id of the selected survey, to highlight it on the list
 *
 */
function AllSurveys(props) {
	return (
		<div>
			<h4>Surveys' List</h4>
			<p>Choose a survey and compile it</p>
			<ListGroup>
				{props.surveys.length > 0 ? (
					props.surveys.map(survey => (
						<Link
							to={'/survey/' + survey.id}
							className={
								parseInt(props.surveyId) === survey.id
									? 'alignLeft list-group-item list-group-item-action text-decoration-none text-reset active'
									: 'alignLeft list-group-item list-group-item-action text-decoration-none text-reset'
							}
							key={survey.id}>
							{survey.title}
						</Link>
					))
				) : (
					<h5>There are no surveys</h5>
				)}
			</ListGroup>
		</div>
	);
}

/**
 *
 * @param {*} props.surveys : list of all surveys of the authenticated user
 * @param {*} props.surveyId : id of the selected survey, to highlight it on the list
 *
 */
function MySurveys(props) {
	return (
		<div>
			<h4>Your Surveys</h4>
			<p>Choose a survey to see its answers</p>
			<ListGroup>
				{props.surveys.length > 0 ? (
					props.surveys.map(survey => (
						<div key={survey.id}>
							{survey.answers > 0 ? (
								<Link
									to={'/survey/' + survey.id}
									className={
										parseInt(props.surveyId) === survey.id
											? 'alignLeft list-group-item list-group-item-action text-decoration-none text-reset active'
											: 'alignLeft list-group-item list-group-item-action text-decoration-none text-reset'
									}
									key={survey.id}>
									<Row>
										<Col xs={8}>{survey.title}</Col>
										<Col xs={4}>
											<span className='alignRight'>({survey.answers} answers)</span>
										</Col>
									</Row>
								</Link>
							) : (
								<ListGroup.Item key={survey.id} disabled className='alignLeft'>
									{survey.title}
									<span className='alignRight'>({survey.answers} answers)</span>
								</ListGroup.Item>
							)}
						</div>
					))
				) : (
					<h5>You have no surveys</h5>
				)}
			</ListGroup>
		</div>
	);
}
