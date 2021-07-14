import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 *
 * @param {*} props.loggedIn : if the user is logged in I show a different text on the homepage
 * @param {*} props.username : when the user is logged in I show his name on the homepage
 *
 */
export default function Homepage(props) {
	return <div>{props.loggedIn ? <LoggedInUser username={props.username} /> : <LoggedOutUser />}</div>;
}

/**
 *
 * @param {*} props.username : username of the authenticated user
 *
 */
function LoggedInUser(props) {
	const [username, setUsername] = useState('');
	useEffect(() => {
		setUsername(props.username);
	}, [props.username]);
	return (
		<div>
			<h1>Welcome back {username}!</h1>
			<h4>Click on the button to create a new Survey</h4>
			<h4>Or click on an existing survey to see its results</h4>
			<Link className='btn btn-primary btn-lg' to='/create'>
				Create a new survey
			</Link>
		</div>
	);
}

function LoggedOutUser() {
	return (
		<div>
			<h1>Welcome to MySurvey!</h1>
			<p>Click on an existing survey on the left sidebar to compile it</p>
		</div>
	);
}
