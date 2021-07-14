import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';

/**
 *
 * @param {*} props.errorMsg  : this is the error message to show
 * @param {*} props.messageType : this is the type of the message we want to show: danger or success
 * @param {*} props.cancelErrorMsg : this is the function to remove the error message
 *
 */
export default function ErrorMessage(props) {
	useEffect(() => {
		let timer;
		if (props.messageType === 'success') {
			timer = setTimeout(() => {
				props.cancelErrorMsg();
			}, 5000);
		}
		return () => {
			clearTimeout(timer);
		};
	});

	if (props.errorMsg)
		return (
			<Alert variant={props.messageType ? props.messageType : 'danger'}>
				<button type='button' className='close' aria-label='Close' onClick={props.cancelErrorMsg}>
					<span aria-hidden='true'>&times;</span>
				</button>
				<strong>{props.messageType === 'success' ? 'Success:' : 'Error:'}</strong> <span>{props.errorMsg}</span>
			</Alert>
		);
	else return null;
}
