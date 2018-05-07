from flask import Flask, redirect, request, render_template, session
from flask_debugtoolbar import DebugToolbarExtension
from flask_sqlalchemy import SQLAlchemy
from jinja2 import StrictUndefined
from datetime import datetime

from model import connect_to_db, db
from model import PollType, Poll, User, Response, Tally, AdminRole, PollAdmin


app = Flask(__name__)
app.jinja_env.undefined = StrictUndefined
app.jinja_env.auto_reload = True

app.secret_key = "secret"

@app.route('/')
def index():
    """Homepage."""
    return render_template('homepage.html')


@app.route('/add-poll')
def add_poll():
    """Add poll form."""

    return render_template('add-poll.html')

@app.route('/add-poll', methods=["POST"])
def add_poll_to_db():
    """Adds poll form data to database"""

    # get data from form
    title = request.form.get('title')
    prompt = request.form.get('prompt')
    poll_type = int(request.form.get('poll_type'))
    is_results_visible = bool(request.form.get('is_results_visible'))
    email = request.form.get('email')
    responses = request.form.get('responses')

    # print title, prompt, poll_type, is_results_visible, email, responses

    if session.get('id'):
        sid = session.get('id')
        user = User.query.filter(User.session_id == sid).one()
        # print user
    else:
        # create User and generate session_id
        user = User(email=email, created_at=datetime.now())
        user.add_session_id()
        session['id'] = user.session_id
        db.session.add(user)
        db.session.commit()
        # print user

    # create PollAdmin


    # if not open-ended, create Response objects

    # generate access code
    # generate short code

    # grab timestamp for created_at

    # add to database

    return render_template('add-poll.html')





if __name__ == "__main__":
    # We have to set debug=True here, since it has to be True at the
    # point that we invoke the DebugToolbarExtension
    app.debug = True
    # make sure templates, etc. are not cached in debug mode
    app.jinja_env.auto_reload = app.debug

    connect_to_db(app)

    # Use the DebugToolbar
    DebugToolbarExtension(app)

    app.run(port=5000, host='0.0.0.0')