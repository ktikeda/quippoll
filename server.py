from flask import Flask, redirect, request, render_template, session
from flask_debugtoolbar import DebugToolbarExtension
from flask_sqlalchemy import SQLAlchemy
from jinja2 import StrictUndefined
from datetime import datetime
from uuid import uuid4
from shortuuid import ShortUUID

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

    # get or create User
    if session.get('id'):
        sid = session.get('id')
        user = User.query.filter(User.session_id == sid).one()
        # print user
    else:
        # create User and generate session_id
        user = User(email=email, created_at=datetime.now(), session_id=uuid4().hex)
        session['id'] = user.session_id
        db.session.add(user)
        db.session.commit()
        # print user

    # create Poll
    admin_code = uuid4().hex
    short_code = ShortUUID().random(length=8)

    # check for duplicates
    while Poll.query.filter(Poll.short_code == short_code).first():
        short_code = ShortUUID().random(length=8)

    poll = Poll(poll_type_id=poll_type, title=title, prompt=prompt, 
        short_code=short_code, admin_code=admin_code, is_results_visible=is_results_visible,
        created_at=datetime.now())

    db.session.add(poll)
    db.session.commit()


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