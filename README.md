# Quippoll
## Summary
Quippoll allows users to create, view, update, and delete their own polls to gather feedback from an audience. User input is collected via webform and SMS, using the Twilio API, and updated in realtime via WebSockets and React. User authentication is handled on the backend with Flask-Login while user permissions for each poll are managed on the frontend with React-Router.

## About the Developer
Quippoll was created by [Karynn Ikeda](https://www.linkedin.com/in/ktikeda/), a software engineer in San Francisco, CA.

## Technologies
* Python
* Flask
* Flask-Login
* Flask-Socketio
* Jinja
* Postgresql
* SQLAlchemy
* Javascript
* jQuery
* Webpack
* React
* React-Router
* SocketIO
* Semiotic
* Bootstrap
* CSS/HTML
* Twilio API

## Features
* Create poll via webform
* Handle open-ended, multiple choice, and multi-select response types
* Manage user permissions to enforce single response per poll and access to admin edit feature
* Respond to poll via webform
* Respond to poll via SMS (Twilio API)
* Generate unique link for poll
* Optionally hide poll results
* Visualize poll results via Semiotic
* Delete poll and response data
* Create account/login
* View user profile
* Auto-update poll results upon new input
* Find poll via geolocation API
* Reorder responses and edit poll prompt and response text

