from flask import Flask, redirect, request, render_template, session, flash
from flask_debugtoolbar import DebugToolbarExtension
from flask_sqlalchemy import SQLAlchemy
from jinja2 import StrictUndefined
from datetime import datetime
from uuid import uuid4
from shortuuid import ShortUUID
import json

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

    # generate access code
    # generate short code
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
    # print poll

    # create PollAdmin
    admin = PollAdmin(poll_id=poll.poll_id, user_id=user.user_id, created_at=datetime.now())
    db.session.add(admin)
    db.session.commit()
    # print admin

    # send poll creation email to user

    # if not open-ended, create Response objects
    if poll.poll_type.name != "open-ended":
        responses = request.form.get('responses')
        responses = responses.split('\n')
        # print responses

        for response in responses:
            response = Response(poll_id=poll.poll_id, user_id=user.user_id, text=response.strip(),
                order=responses.index(response), created_at=datetime.now())
            db.session.add(response)
        db.session.commit()

        # print poll.responses

    return redirect('/' + poll.short_code)


@app.route('/<short_code>')
def add_user_input(short_code):
    """Poll response submission display"""

    poll = Poll.get_from_code(short_code)

    if poll.poll_type.collect_response:
        return render_template('add-response.html', poll=poll)
    else:
        return render_template('add-tally.html', poll=poll)


@app.route('/<short_code>', methods=["POST"])
def add_user_input_to_db(short_code):
    """Poll response submission display"""

    poll = Poll.get_from_code(short_code)
    user = User.get_from_session(session)

    if poll.poll_type.collect_response:  # Add responses to db
        text = request.form.get('response')
        
        response = Response(poll_id=poll.poll_id, user_id=user.user_id, text=text,
                            created_at=datetime.now(), order=1)
        db.session.add(response)
        db.session.commit()
        print response
    
    else:  # Add tallys to db
        tallys = json.loads(request.form.get('tallys'))

        for response_id, tally_num in tallys.items():
            response = Response.query.get(int(response_id))
            print response
            for tally in range(int(tally_num)):
                tally = Tally(response_id=response.response_id, user_id=user.user_id, 
                              created_at=datetime.now())
                db.session.add(tally)
                db.session.commit()
                print tally

    if poll.is_results_visible:
        flash('Your response has been recorded.')
        route = '/' + poll.short_code + '/r'
    else:
        route = '/success'
    
    return redirect(route)


@app.route('/<short_code>/r')
def show_results(short_code):
    """Show poll results."""
    
    poll = Poll.get_from_code(short_code)
    # print poll

    return render_template('results.html', poll=poll)


@app.route('/success')
def success():
    """Show success page."""

    return render_template('success.html')


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