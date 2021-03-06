from flask import redirect, request, render_template, session, flash, jsonify
from flask_debugtoolbar import DebugToolbarExtension
from flask_login import current_user, login_user, logout_user, login_required
from datetime import datetime
import json
import sys
import logging

from twilio.twiml.messaging_response import Body, Message, Redirect, MessagingResponse

from flask_socketio import emit, disconnect, join_room

from app import app, login
from app import socketio, thread, thread_lock
from model import connect_to_db, db
from model import PollType, Poll, User, Response, Tally, AdminRole, PollAdmin

# Setup logging:
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# handler = logging.FileHandler("log_" + datetime.now().strftime('%Y%m%d%H%M%S'))
# handler.setLevel(logging.DEBUG)

# formatter = logging.Formatter("%(asctime)s %(levelname)s: %(message)s")
# handler.setFormatter(formatter)

# logger.addHandler(handler)

# Uncomment line below to also stream logging to STDOUT
logger.addHandler(logging.StreamHandler(sys.stdout))

# import pdb; pdb.set_trace()


# Begin socketio routes
def emit_response_update(response):
    """Send updated response data as server generated event to clients."""

    logger.info("Server emitted response update")

    poll = Poll.query.get(response.poll_id)

    data = {'response_id' : response.response_id,
            'text' : response.text,
            'value' : response.value(),
            'is_visible': response.is_visible}

    socketio.emit('response_update',
                  data,
                  namespace='/poll',
                  room=poll.short_code)


def emit_response_creation(response):
    """Send new response data as server generated event to clients."""
    logger.info("Server emitted response creation")

    poll = Poll.query.get(response.poll_id)

    data = {'response_id' : response.response_id,
            'text' : response.text,
            'value' : response.value(),
            'is_visible': response.is_visible}
    
    socketio.emit('response_creation',
         data,
         namespace='/poll',
         room=poll.short_code)

# TODO: Create rooms for each poll
@socketio.on('response_update', namespace='/poll')
def broadcast_response_update(message):
    logger.info(f"broadcast response update {message}")
    response_id = message['data']['response_id']
    response = Response.query.get(response_id)

    socketio.emit('response_update',
         {'response_id' : response_id, 'value': response.value(), 'text' : response.text},
         namespace='/poll',
         room=message['room'],
         include_self=False)


@socketio.on('response_order_change', namespace='/poll')
def broadcast_response_order(message):
    logger.info(message)
    socketio.emit('new_response_order',
         {'order': message['data']},
         namespace='/poll',
         room=message['room'],
         include_self=False)


@socketio.on('response_deletion', namespace='/poll')
def broadcast_response_deletion(message):
    logger.info(message)
    socketio.emit('response_deletion',
         {'response_id': message['data']['response_id']},
         namespace='/poll',
         room=message['room'],
         include_self=False)


@socketio.on('poll_update', namespace='/poll')
def broadcast_poll_update(message):
    logger.info(f'broadcast poll update {message}')
    poll_id = message['data']['poll_id']
    poll = Poll.query.get(poll_id)

    socketio.emit('poll_update',
         message['data'],
         namespace='/poll',
         room=message['room'],
         include_self=False)


@socketio.on('join', namespace='/poll')
def join(message):
    join_room(message['room'])
    logger.info(f"{message['room']} joined")


@socketio.on('leave', namespace='/poll')
def leave(message):
    leave_room(message['room'])
    logger.info(f"{message['room']} left")


@socketio.on('connect', namespace='/poll')
def test_connect():
    logger.info('Server is connected.')


@socketio.on('client_connect', namespace='/poll')
def test_client_connect(message):
    logger.info(message['data'])

# End socket.io routes


@app.route('/')
def index():
    """Homepage."""

    user = current_user
    # print "is_authenticated", user.is_authenticated
    return render_template('index.html', current_user=user)


@app.route('/add-poll')
def add_poll():
    """Show add poll form."""

    return render_template('add-poll.html')


@app.route('/features')
def show_features():
    """Show about page."""

    return render_template('features.html')


@app.route('/add-poll', methods=["POST"])
def add_poll_to_db():
    """Adds poll form data to database"""

    # get data from form
    prompt = request.form.get('prompt')
    poll_type = int(request.form.get('poll_type'))
    is_results_visible = bool(request.form.get('is_results_visible'))
    title = prompt

    # create and add objects to db
    if current_user.is_authenticated:
        user = current_user
    else:
        user = User()

    poll = Poll(poll_type_id=poll_type,
                title=title,
                prompt=prompt,
                is_results_visible=is_results_visible)

    PollAdmin(poll_id=poll.poll_id, user_id=user.user_id)

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
                                weight=responses.index(response) + 1)
            db.session.add(response)
        db.session.commit()  # only commit once all Responses are added

    route = '/' + poll.short_code
    return redirect(route)


@app.route('/favicon.ico')
def _():
    # print 'favicon'
    return ''


@app.route('/<short_code>')
def render_poll(short_code):
    """Show poll in React."""

    poll = Poll.get_from_code(short_code)
    user = User.get_user()

    logger.info(session)
    logger.info(f'poll: {poll}')

    if poll is not None:  # Ensure this is a valid poll route
        if user.is_admin(poll):
            logger.info("Admin view")
            return render_template('poll-react.html', poll=poll, async_mode=socketio.async_mode)
        elif not poll.is_open:
            logger.info("Poll not open")
            return render_template('poll-closed.html', poll=poll)
        elif user.may_respond(poll):
            logger.info('User may respond')
            return render_template('poll-react.html', poll=poll, async_mode=socketio.async_mode)
        elif not poll.is_results_visible:
            "User has voted but results not visible"
            route = '/' + poll.short_code + '/success'
        else:
            "User has voted, showing results"
            route = '/' + short_code + '/results'
    else:
        flash('Sorry, that page does not exist.')
        route = '/'

    return redirect(route)


@app.route('/<short_code>/results')
def show_results(short_code):

    poll = Poll.get_from_code(short_code)
    user = User.get_user()

    if poll is not None:  # Ensure this is a valid poll route
        if user.is_admin(poll):
            return render_template('poll-react.html', poll=poll)
        elif not poll.is_open:
            return render_template('poll-closed.html', poll=poll)
        elif not poll.is_results_visible:
            route = '/' + poll.short_code + '/success'
        else:
            return render_template('poll-react.html', poll=poll)
    else:
        flash('Sorry, that page does not exist.')
        route = '/'

    return redirect(route)


@app.route('/<short_code>/edit')
def edit_poll(short_code):
    """Edit poll."""
    poll = Poll.get_from_code(short_code)
    
    if current_user.is_authenticated and current_user.is_admin(poll):
        return render_template('poll-react.html', poll=poll)
    else:
        return redirect('/' + short_code)


@app.route('/<short_code>/success')
def success(short_code):
    """Show success page."""

    poll = Poll.get_from_code(short_code)

    return render_template('success.html')


@app.route('/profile')
def show_profile():
    if current_user.is_authenticated:
        logger.info(session)
        return render_template('user-profile.html')
    else:
        return redirect('/')


@app.route('/locate')
def locate_user():
    return render_template('locate.html')


@app.route('/locate', methods=['POST'])
def locate_poll():
    """Receives lat/long and attempts to locate poll near coordinates."""

    lat = float(request.form.get('latitude'))
    lng = float(request.form.get('longitude'))
    radius = 0.0001  # Radius is about 36 ft

    polls = Poll.query.filter( (Poll.latitude > lat - radius) & (Poll.latitude < lat + radius) &
                               (Poll.longitude > lng - radius) & (Poll.longitude < lng + radius)).all()

    if len(polls) == 1:
        poll = polls[0]
        route = '/' + poll.short_code

    elif polls:
        flash('More than one poll was found.')
        route = '/locate'
    else:
        flash('Sorry we could not find any polls near you.')
        route = '/locate'

    return route


@app.route('/polls/<int:poll_id>/delete', methods=['POST'])
@login_required
def delete_redirect_poll(poll_id):
    """Delete all data associated with a poll"""

    poll = Poll.query.get(poll_id)

    if current_user.is_admin(poll):
        poll.delete()
        flash('Your poll has been deleted.')
    else:
        flash('You do not have permission to delete this poll.')

    return redirect('/profile')


@app.route('/polls/<int:poll_id>/settings')
def show_poll_settings(poll_id):
    poll = Poll.query.get(poll_id)

    if current_user.is_authenticated and current_user.is_admin(poll):
        return render_template('settings.html', poll=poll)
    else:
        return redirect('/')


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


# Begin twilio routes
@app.route("/sms", methods=['POST'])
def sms_find_poll():
    """Find poll from sms"""
    # Start our response

    resp = MessagingResponse()
    sms = request.values['Body']
    poll = Poll.get_from_code(sms)
    # del session['short_code']

    if 'short_code' in session:

        short_code = session['short_code']
        poll = Poll.get_from_code(short_code)

        if poll.poll_type.multi_select:
            if sms[0].upper() == 'N':
                del session['short_code']
                resp.message('Thank you for responding.')
                return str(resp)
            elif sms[0].upper() == 'Y':
                resp.redirect('/sms/' + short_code)
            else:
                resp.message('Please type "Y" for Yes or "N" for No.')
        resp.redirect('/sms/' + short_code + '/input')
    elif poll:
        resp.redirect('/sms/' + sms)
    else:
        resp.message('That poll does not exist')

    return str(resp)


@app.route("/sms/<short_code>", methods=['POST'])
def sms_show_prompt(short_code):
    poll = Poll.get_from_code(short_code)
    phone = request.values['From']
    user = User.get_from_phone(phone)
    resp = MessagingResponse()

    if ((poll.poll_type.collect_response and Response.get_response(poll=poll, user=user)) or
        (user in poll.get_users_from_tally() and not poll.poll_type.multi_select)):

        resp.message('You have already submitted a response.')

    elif poll.poll_type.collect_response:
        resp.message(poll.prompt + '\n\nEnter your response.')

    else:
        resp.message(poll.prompt + '\n\nEnter # of response option.')

    session['short_code'] = poll.short_code

    return str(resp)


@app.route('/sms/<short_code>/input', methods=['POST'])
def sms_add_input(short_code):
    poll = Poll.get_from_code(short_code)
    resp = MessagingResponse()
    sms = request.values['Body']
    phone = request.values['From']
    user = User.get_from_phone(phone)

    # Handle responses
    if poll.poll_type.collect_response:
        weight = Response.query.filter(Response.poll_id == poll.poll_id).count()
        response = Response(poll_id=poll.poll_id,
                            user_id=user.user_id,
                            text=sms,
                            weight=weight)
        db.session.add(response)
        db.session.commit()

        resp.message('Your response "{}" has been recorded.'.format(response.text))
        del session['short_code']

    # Handle tallys
    else:
        # Check that sms is a number
        try:
            index = int(sms)
            responses = poll.responses
            
            try:
                response = responses[index-1]

                # Check that response option exists
                if response:

                    # Check that user hasn't already responded
                    if Tally.query.filter(Tally.response_id == response.response_id,
                                          Tally.user_id == user.user_id).first():

                        resp.message('You have already responsed for "{}".'.format(response.text))

                    # Add tally
                    else:
                        tally = Tally(response_id=response.response_id,
                                      user_id=user.user_id)
                        db.session.add(tally)
                        db.session.commit()

                        # emit_new_result(response)
                        emit_response_update(response)

                        resp.message('Your response "{}" has been recorded.'.format(response.text))

                    if poll.poll_type.multi_select:
                        resp.message('Continue responding? Y/N')
                        return str(resp)
                        # redirect for route for Y/N

                    del session['short_code']

            except:
                resp.message('Sorry that response does not exist. Please enter another number.')

        except:
            resp.message('Sorry, please enter your response option as a number.')

    return str(resp)

# End twilio routes


# API routes for AJAX
api = '/api'

@app.route(api + '/polls', methods=['POST'])
def create_poll():
    """Create new poll"""
    pass


@app.route(api + '/polls/<int:poll_id>', methods=["GET"])
def get_poll(poll_id):
    """Get poll data for a poll id"""
    poll = Poll.query.get(poll_id)

    responses = [{'response_id' : response.response_id, 
                  'text' : response.text,
                  'value' : response.value(),
                  'is_visible': response.is_visible} for response in poll.responses]

    return jsonify({"poll_id" : poll.poll_id, 
                    "poll_type" : poll.poll_type.name,
                    "collect_response" : poll.poll_type.collect_response,
                    "collect_tally" : poll.poll_type.collect_tally,
                    "multi_select" : poll.poll_type.multi_select,
                    "title" : poll.title,
                    "prompt" : poll.prompt, 
                    "short_code" : poll.short_code,
                    "is_results_visible" : poll.is_results_visible,
                    "is_open" : poll.is_open,
                    "responses" : responses})


@app.route(api + '/polls/<int:poll_id>', methods=['POST'])
def update_poll(poll_id):
    """Update poll data for a poll id"""
    poll = Poll.query.get(poll_id)
    data = request.form.to_dict()
    resp_data = {'poll_id' : poll_id}

    for attr, val in data.iteritems():

        if attr == 'short_code' and Poll.get_from_code(val):
            return 'This short code is already in use.'

        setattr(poll, attr, val)
        resp_data[attr] = val
        poll.updated_at = datetime.now()
        db.session.add(poll)
        db.session.commit()

    return jsonify(resp_data)


@app.route(api + '/polls/<int:poll_id>', methods=['DELETE'])
@login_required
def delete_poll(poll_id):
    """Delete all data associated with a poll"""

    poll = Poll.query.get(poll_id)

    if current_user.is_admin(poll):
        poll.delete()
        flash('Your poll has been deleted.')
    else:
        flash('You do not have permission to delete this poll.')

    return redirect('/profile')


@app.route(api + '/polls/<int:poll_id>/user', methods=["GET"])
def get_user_data(poll_id):
    """Get user data for a poll id"""
    poll = Poll.query.get(poll_id)
    user = User.get_user()

    data = {"user_id" : user.user_id, 
            "is_admin" : user.is_admin(poll),
            "may_respond" : user.may_respond(poll)}

    return jsonify(data)


@app.route(api + '/polls/<int:poll_id>/responses', methods=["GET"])
def get_responses(poll_id):
    """Gets all responses associated with poll id"""
    poll = Poll.query.get(poll_id)

    responses = [{'response_id' : response.response_id,
                  'text' : response.text,
                  'value' : response.value(),
                  'is_visible': response.is_visible} for response in poll.responses]

    logger.info(responses)

    return jsonify({"response_data" : responses})


@app.route(api + '/polls/<int:poll_id>/responses', methods=["POST"])
def create_responses(poll_id):
    """Create new responses for a poll in db"""

    poll = Poll.query.get(poll_id)
    user = User.get_user()
    responses = request.json['responses']

    last_response = Response.query.filter(Response.poll_id == poll.poll_id).order_by(Response.weight.desc()).first()

    if last_response:
        weight = last_response.weight + 1
    else:
        weight = 1

    response_data = []

    for response in responses:
        new_response = Response(poll_id=poll.poll_id,
                            user_id=user.user_id,
                            text=response['text'],
                            weight=weight)
        db.session.add(new_response)
        db.session.commit()

        emit_response_creation(new_response);

        response_data.append({'response_id' : new_response.response_id,
                              'user_id' : new_response.user_id,
                              'text' : new_response.text,
                              'value' : 0,
                              'weight' : new_response.weight,
                              'is_visible' : new_response.is_visible})

    data = {'response_data' : response_data}

    return jsonify(data)


@app.route(api + '/polls/<int:poll_id>/responses/<int:response_id>', methods=["GET"])
def get_response(poll_id, response_id):
    """Get data for response by response id"""
    response = Response.query.get(int(response_id))

    response_data = {'response_id' : response.response_id, 
                     'user_id' : response.user_id,
                     'text' : response.text,
                     'value' : response.value(),
                     'is_visible': response.is_visible}

    return jsonify(response_data)


@app.route(api + '/polls/<int:poll_id>/responses/<int:response_id>', methods=['POST'])
def update_response(poll_id, response_id):
    """Update response data for a response id"""
    response = Response.query.get(int(response_id))

    data = request.form.to_dict()

    # TODO: Check that attr are in dict
    for attr, val in data.iteritems():
        if attr == 'weight':
            index = int(val)
            logger.info(index)
            weight = 1
            if index != 0:
                prev_response = Response.query.filter(Response.poll_id == poll_id).order_by(Response.weight.asc()).offset(index-1).first()
                
                weight += prev_response.weight
            setattr(response, attr, weight)
            response.updated_at = datetime.now()
            db.session.add(response)
            db.session.commit()
            

            responses = Response.query.filter(Response.poll_id == poll_id).order_by(Response.weight.asc(), Response.updated_at.desc()).offset(index).all()
            
            if len(responses) > 1:
                index = 1
                while index != len(responses) and responses[index-1].weight >= responses[index].weight:
                    responses[index].weight += 1
                    db.session.add(responses[index])
                    index += 1
                db.session.commit()
            
        elif attr != 'response_id':
            setattr(response, attr, val)
            response.updated_at = datetime.now()
            db.session.add(response)
            db.session.commit()

    # emit_response_update(response)

    return jsonify(response.data())


@app.route(api + '/polls/<int:poll_id>/responses/<int:response_id>', methods=['DELETE'])
def delete_response(poll_id, response_id):
    """Delete response from poll"""
    logger.info(response_id)
    poll = Poll.query.get(int(poll_id))
    response = Response.query.get(int(response_id))

    Tally.query.filter(Tally.response_id == response.response_id).delete()
    db.session.commit()

    Response.query.filter(Response.response_id == response.response_id).delete()
    db.session.commit()

    return jsonify({'response_id' : response_id})


@app.route(api + '/polls/<int:poll_id>/tallys', methods=["POST"])
def create_tallys(poll_id):
    """Create multiple new tallys for a response in db"""

    poll = Poll.query.get(poll_id)
    user = User.get_user()

    # TODO: Write logic to query user and poll, and not add to db if already exists

    tallys = request.json['tallys']
    tallys_data = []

    for tally in tallys:
        response = Response.query.get(tally['response_id'])

        new_tally = Tally(response_id=response.response_id, user_id=user.user_id)
        db.session.add(new_tally)
        db.session.commit()

        tallys_data.append(new_tally.data())

        if poll.poll_type.poll_type_id == 4:
            emit_response_update(response)

    return jsonify({'tallys' : tallys_data})


@app.route(api + '/polls/<int:poll_id>/responses/<int:response_id>/tallys/<int:tally_id>', methods=['DELETE'])
def delete_tally(poll_id, response_id, tally_id):
    """Delete tally from poll"""
    response = Response.query.get(response_id)
    tally = Tally.query.get(tally_id)

    Tally.query.filter(Tally.tally_id == tally.tally_id).delete()
    db.session.commit()

    emit_response_update(response)

    return jsonify({'tally_id' : tally_id})


if __name__ == "__main__":
    # We have to set debug=True here, since it has to be True at the
    # point that we invoke the DebugToolbarExtension
    # app.debug = True
    # make sure templates, etc. are not cached in debug mode
    # app.jinja_env.auto_reload = app.debug

    connect_to_db(app)

    # Use the DebugToolbar
    # DebugToolbarExtension(app)

    # Run server in developer mode
    socketio.run(app, debug=False, port=5000)

    # Run server in developer mode in vagrant
    # socketio.run(app, debug=True, host='0.0.0.0', port=5000)

    # Run server in production
    # socketio.run(app, debug=False, port=5000)
