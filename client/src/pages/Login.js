import { Form, Button, Alert } from 'react-bootstrap';
import { useState, useEffect } from 'react';

/**
 *
 * @param {*} props.login : when the user click on the login button, the login function will be called
 * @param {*} props.errorMessage : if there is an error during the login, I show it to the user
 *
 */
function Login(props) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		setErrorMessage(props.errorMessage);
	}, [props.errorMessage]);

	const handleSubmit = event => {
		event.preventDefault();
		const credentials = { username, password };

		let valid = true;
		if (username === '' || password === '' || password.length < 6) valid = false;

		if (valid) {
			props.login(credentials);
		} else {
			setErrorMessage('Invalid username and/or password');
		}
	};

	return (
		<Form>
			{errorMessage ? <Alert variant='danger'>{errorMessage}</Alert> : ''}
			<Form.Group controlId='username'>
				<Form.Label>email</Form.Label>
				<Form.Control type='email' value={username} onChange={ev => setUsername(ev.target.value)} />
			</Form.Group>
			<Form.Group controlId='password'>
				<Form.Label>Password</Form.Label>
				<Form.Control type='password' value={password} onChange={ev => setPassword(ev.target.value)} />
			</Form.Group>
			<Button onClick={handleSubmit}>Login</Button>
		</Form>
	);
}

export default Login;
