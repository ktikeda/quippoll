# Quippoll
## Summary
[Live Deployment](http://quippoll.com/)

Quippoll allows users to create, view, update, and delete their own polls to gather feedback from an audience. User input is collected via webform and SMS, using the Twilio API, and updated in realtime via WebSockets and React. User authentication is handled on the backend with Flask-Login while user permissions for each poll are managed on the frontend with React-Router.

## About the Developer
Quippoll was created by [Karynn Ikeda](https://www.linkedin.com/in/ktikeda/), a software engineer in San Francisco, CA.

## Technologies

Backend
* Python
* Flask
* [Flask-Login](https://flask-login.readthedocs.io/en/latest/)
* [Flask-Socketio](https://github.com/miguelgrinberg/Flask-SocketIO)
* Jinja
* Postgresql
* SQLAlchemy

Frontend
* Javascript
* jQuery
* Webpack
* React
* [React-Router](https://github.com/ReactTraining/react-router)
* [React-Sortable-HOC](https://github.com/clauderic/react-sortable-hoc)
* [React-Flip-Move](https://github.com/joshwcomeau/react-flip-move)
* [SocketIO](https://socket.io/)
* [Semiotic](https://github.com/emeeks/semiotic)
* Bootstrap
* CSS/HTML

APIs
* Twilio API

## Features

### Poll Creation & Management
* Create poll via webform
* Handle open-ended, multiple choice, and multi-select response types
* Generate unique link for poll
* Optionally close poll and hide poll results
* Set poll geolocation and find poll via geolocation API
* Reorder responses and edit poll prompt and response text
* Delete poll and response data

### Response Collection
* Respond to poll via webform
* Respond to poll via SMS (Twilio API)

### Results Visualization
* Visualize poll results as bar chart or pie chart via Semiotic
* Auto-update poll results upon new input

### Accounts & User Permissions
* Create account/login
* View user profile
* Manage user permissions to enforce single response per poll and access to admin edit feature

