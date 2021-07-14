import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

/**
 *
 * @param {*} props.loggedIn : if the user is logged in I show the logout button, else I show the login button
 * @param {*} props.doLogOut : if the user click on the logout button he will automatically log out
 *
 */
export default function TopBar(props) {
	return (
		<Navbar bg='light' variant='light'>
			<Link to='/' className='navbar-brand'>
				<i className='fas fa-poll-h fa-2x'></i>
				<span style={{ fontSize: '1.5em' }}> MySurvey</span>
			</Link>
			<Nav className='mr-auto'>
				<Link to='/' className='nav-link' style={{ fontSize: '1.1em' }}>
					Homepage
				</Link>
			</Nav>
			<Navbar.Collapse className='justify-content-end'>
				{props.loggedIn ? (
					<Link className='btn btn-outline-danger' onClick={props.doLogOut} to='/'>
						Logout
					</Link>
				) : (
					<Link className='btn btn-outline-success' to='/login'>
						Login
					</Link>
				)}
			</Navbar.Collapse>
		</Navbar>
	);
}
