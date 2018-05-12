from flask import redirect, request, render_template, session, flash
from flask_debugtoolbar import DebugToolbarExtension
from flask_login import current_user, login_user, logout_user, login_required
import json

from app import app, login
from model import connect_to_db, db
from model import PollType, Poll, User, Response, Tally, AdminRole, PollAdmin


@app.route('/')
def index():
    """Homepage."""
    # print session
    user = current_user
    # print "is_authenticated", user.is_authenticated
    return render_template('index.html', current_user=user)


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

    # create and add objects to db
    if current_user.is_authenticated:
        user = current_user
    else:
        user = User()

    poll = Poll(poll_type_id=poll_type,
                title=title,
                prompt=prompt,
                is_results_visible=is_results_visible)

    admin = PollAdmin(poll_id=poll.poll_id, user_id=user.user_id)

    # TODO: send poll creation email to user
    # email = request.form.get('email')

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
    user = User.get_user()

    if poll is not None:  # Ensure this is a valid poll route
        if poll.poll_type.collect_response:
            if not Response.query.filter(Response.user_id == user.user_id, Response.poll_id == poll.poll_id).first():
                return render_template('add-response.html', poll=poll)
        else:
            # TODO: make a direct query to db
            # Tally.query.filter(Tally.user_id == user.user_id).first():
            if user not in poll.get_users_from_tally():
                return render_template('add-tally.html', poll=poll)

    else:
        flash('Sorry, that page does not exist.')
        route = '/'
        return redirect(route)

@app.route('/<short_code>', methods=["POST"])
def add_user_input_to_db(short_code):
    """Add tally/response data to db"""

    poll = Poll.get_from_code(short_code)
    user = User.get_user()

    # TODO: Need to deal with assigning session_id to anon users

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

        for response_text in tallys:
            response = Response.query.filter(Response.text == response_text,
                                             Response.poll_id == poll.poll_id).one()

            tally = Tally(response_id=response.response_id, user_id=user.user_id)
            db.session.add(tally)
            db.session.commit()

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


@app.route('/profile')
def show_profile():
    if current_user.is_authenticated:
        return render_template('user-profile.html')
    else:
        return redirect('/')


@app.route('/delete', methods=['POST'])
@login_required
def delete_poll():
    """Delete all data associated with a poll"""

    short_code = request.form.get('p')

    poll = Poll.get_from_code(short_code)

    if current_user.is_admin(poll):
        poll.delete()
        flash('Your poll has been deleted.')
    else:
        flash('You do not have permission to delete this poll.')

    return redirect('/profile')


# Implementation of flask_login sourced from:
# https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-v-user-logins
@login.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.route('/login')
def show_login():
    if current_user.is_authenticated:
        return redirect('/')
    else:
        return render_template('login.html')


@app.route('/login', methods=['POST'])
def login():
    # grab form data
    email = request.form.get('email')
    pw = request.form.get('password')

    # query User
    user = User.query.filter(User.email == email).first()

    # validate user/password
    if user is None or not user.check_password(pw):
        flash('Invalid email or password.')
        return redirect('/login')

    # login user
    login_user(user)

    flash('You are logged in.')
    return redirect('/profile')


@app.route('/logout')
def logout():
    if current_user.is_authenticated:
        logout_user()
        flash('You have been logged out.')

    return redirect('/')


@app.route('/register')
def show_registration():
    if current_user.is_authenticated:
        return redirect('/')
    else:
        return render_template('register.html')


@app.route('/register', methods=['POST'])
def register():
    """Creates user by email if user with email does not already exist."""
    
    email = request.form.get('email')

    if User.query.filter(User.email == email).first():
        flash('Sorry, a user with that email already exists.')
        return redirect('/register')

    fname = request.form.get('fname')
    lname = request.form.get('lname')
    pw = request.form.get('password')

    # check if session_id present
    user = User.get_from_session(session,
                                 fname=fname,
                                 lname=lname,
                                 email=email)

    user.set_password(pw)
    db.session.add(user)
    db.session.commit()

    flash('Your registration was successful.')
    return redirect('/login')

# End flask_login routes

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