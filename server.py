from flask import Flask, redirect, request, render_template, session, flash
from flask_debugtoolbar import DebugToolbarExtension
from jinja2 import StrictUndefined
from flask_login import LoginManager
import json

from model import connect_to_db, db
from model import Poll, User, Response, Tally, PollAdmin


app = Flask(__name__)
login = LoginManager(app)
app.jinja_env.undefined = StrictUndefined
app.jinja_env.auto_reload = True

app.secret_key = "secret"


@app.route('/')
def index():
    """Homepage."""
    return render_template('homepage.html')


@app.route('/add-poll')
def add_poll():
    """Show add poll form."""

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

    # create and add objects to db
    user = User.get_from_session(session, email=email)

    poll = Poll(poll_type_id=poll_type,
                title=title, 
                prompt=prompt,
                is_results_visible=is_results_visible)

    admin = PollAdmin(poll_id=poll.poll_id, user_id=user.user_id)

    # TODO: send poll creation email to user

    # if not open-ended, create Response objects
    if not poll.poll_type.collect_response:
        # parse responses from form
        responses = request.form.get('responses')
        responses = responses.split('\n')

        for response in responses:
            response = Response(poll_id=poll.poll_id,
                                user_id=user.user_id,
                                text=response.strip(),
                                order=responses.index(response))
            db.session.add(response)
        db.session.commit()  # only commit once all Responses are added

    route = '/' + poll.short_code
    return redirect(route)


@app.route('/<short_code>')
def add_user_input(short_code):
    """Poll response submission display"""

    poll = Poll.get_from_code(short_code)
    user = User.get_from_session(session)

    if poll.poll_type.collect_response:
        if Response.query.filter(Response.user_id == user.user_id, Response.poll_id == poll.poll_id).first():
            return render_template('add-response.html', poll=poll)
    else:
        # TODO: make a direct query to db
        # Tally.query.filter(Tally.user_id == user.user_id).first():
        if user not in poll.get_users_from_tally():
            return render_template('add-tally.html', poll=poll)

    route = '/' + poll.short_code + '/success'
    return redirect(route)


@app.route('/<short_code>', methods=["POST"])
def add_user_input_to_db(short_code):
    """Add tally/response data to db"""

    poll = Poll.get_from_code(short_code)
    user = User.get_from_session(session)

    # Add responses to db
    if poll.poll_type.collect_response:
        text = request.form.get('response')

        response = Response(poll_id=poll.poll_id,
                            user_id=user.user_id,
                            text=text,
                            order=1)
        db.session.add(response)
        db.session.commit()

    else:  # Add tallys to db
        tallys = json.loads(request.form.get('tallys'))

        for response_id, tally_num in tallys.items():
            response = Response.query.get(int(response_id))

            for tally in range(int(tally_num)):
                tally = Tally(response_id=response.response_id, user_id=user.user_id,)
                db.session.add(tally)
            db.session.commit()  # only commit once all Tallys are added

    flash('Your response has been recorded.')
    route = '/' + poll.short_code + '/success'
    return redirect(route)


@app.route('/<short_code>/r')
def show_results(short_code):
    """Show poll results."""

    poll = Poll.get_from_code(short_code)

    return render_template('results.html', poll=poll)


@app.route('/<short_code>/success')
def success(short_code):
    """Show success page."""

    poll = Poll.get_from_code(short_code)

    if poll.is_results_visible:
        route = '/' + poll.short_code + '/r'
        return redirect(route)
    else:
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