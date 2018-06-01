from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

from flask import session

# Implementation of flask_login sourced from: https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-v-user-logins
from flask_login import UserMixin, current_user, login_user
from werkzeug.security import generate_password_hash, check_password_hash

from uuid import uuid4
from datetime import datetime
from shortuuid import ShortUUID


class PollType(db.Model):
    """Poll type model. Attributes generate multiple-choice, select-all, open-ended polls."""

    __tablename__ = 'poll_types'

    poll_type_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    name = db.Column(db.String(20), nullable=False)
    collect_response = db.Column(db.Boolean, nullable=False)
    collect_tally = db.Column(db.Boolean, nullable=False)
    multi_select = db.Column(db.Boolean, nullable=False)
    tally_value_min = db.Column(db.Integer, nullable=False, default=1)
    tally_value_max = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now())
    updated_at = db.Column(db.DateTime, nullable=True)

    polls = db.relationship('Poll', lazy='joined')  # returns a list of all polls with poll type

    def __repr__(self):
        return "<Poll Type id={} name={}>".format(self.poll_type_id, self.name)

    def __init__(self, name, collect_response, collect_tally, **kwargs):
        """Create PollType from name, collect_response, and collect_tally
           and add to db."""

        self.name = name
        self.collect_response = collect_response
        self.collect_tally = collect_tally

        if kwargs is not None:
            for attr, val in kwargs.iteritems():
                setattr(self, attr, val)

        db.session.add(self)
        db.session.commit()


class Poll(db.Model):
    """Poll model."""

    __tablename__ = 'polls'

    poll_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    poll_type_id = db.Column(db.Integer, db.ForeignKey('poll_types.poll_type_id'), nullable=False)
    title = db.Column(db.String(128), nullable=False)
    prompt = db.Column(db.String(128), nullable=False)
    short_code = db.Column(db.String(32), nullable=False)
    admin_code = db.Column(db.String(32), nullable=False)
    is_results_visible = db.Column(db.Boolean, nullable=False, default=True)
    is_open = db.Column(db.Boolean, nullable=False, default=True)  # this might be denormalizing data with open_at
    is_moderated = db.Column(db.Boolean, nullable=False, default=False)
    is_unique_response = db.Column(db.Boolean, nullable=False, default=True)
    reponse_max = db.Column(db.Integer, nullable=True)
    tally_max = db.Column(db.Integer, nullable=True)
    open_at = db.Column(db.DateTime, nullable=True)
    close_at = db.Column(db.DateTime, nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now())
    updated_at = db.Column(db.DateTime, nullable=True)

    responses = db.relationship('Response', order_by='Response.weight')  # returns a list of Response objects
    poll_type = db.relationship('PollType', lazy='joined')  # returns PollType object
    users_from_response = db.relationship('User', secondary='responses')  #returns list of User objects who have created Response objects

    def __repr__(self):
        return "<Poll id={} poll_type_id={} title={}>".format(self.poll_id, self.poll_type_id, self.title)

    def __init__(self, poll_type_id, title, prompt, **kwargs):
        """Create Poll from poll_type_id, title, and prompt
           and add to db."""

        admin_code = uuid4().hex
        short_code = ShortUUID().random(length=8)

        # check for duplicates
        while Poll.query.filter(Poll.admin_code == admin_code).first():
            admin_code = uuid4().hex

        while Poll.query.filter(Poll.short_code == short_code).first():
            short_code = ShortUUID().random(length=8)

        self.admin_code = admin_code
        self.short_code = short_code
        self.poll_type_id = poll_type_id
        self.title = title
        self.prompt = prompt

        if kwargs is not None:
            for attr, val in kwargs.iteritems():
                setattr(self, attr, val)

        db.session.add(self)
        db.session.commit()

    def get_users_from_tally(self):
        responses = self.responses
        users = set()

        for response in responses:
            r_users = set(response.users)
            users = users | r_users

        return list(users)

    def delete(self):
        """Delete all data associated with a poll."""

        # Delete Tally records
        responses = self.responses

        for response in responses:
            Tally.query.filter(Tally.response_id == response.response_id).delete()
            db.session.commit()

        # Delete Response records
        Response.query.filter(Response.poll_id == self.poll_id).delete()
        db.session.commit()

        # Delete PollAdmin records
        PollAdmin.query.filter(PollAdmin.poll_id == self.poll_id).delete()
        db.session.commit()

        # Delete Poll record
        Poll.query.filter(Poll.poll_id == self.poll_id).delete()
        db.session.commit()

    def get_response_by(self, **kwargs):
        attr = kwargs.keys()[0]
        val = kwargs.values()[0]
        if hasattr(Response, attr):
            return Response.query.filter(Response.poll_id == self.poll_id, getattr(Response, attr) == val).first()
        else:
            return None

    @staticmethod
    def get_from_code(short_code):
        return Poll.query.options(db.joinedload('responses')).filter(Poll.short_code == short_code).first()


class User(UserMixin, db.Model):
    """User model. UserMixin from flask_login"""

    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    fname = db.Column(db.String(32), nullable=True)
    lname = db.Column(db.String(32), nullable=True)
    email = db.Column(db.String(128), nullable=True)
    password_hash = db.Column(db.String(128), nullable=True)
    session_id = db.Column(db.String(32), nullable=True)
    twitter = db.Column(db.String(32), nullable=True)
    phone = db.Column(db.String(32), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now())
    updated_at = db.Column(db.DateTime, nullable=True)

    admin_polls = db.relationship('Poll', secondary='poll_admins', backref='admins', lazy='joined')  # returns a list of polls administered by user

    def __repr__(self):
        return "<User id={}>".format(self.user_id)

    def __init__(self, **kwargs):
        if kwargs is not None:
            for attr, val in kwargs.iteritems():
                setattr(self, attr, val)

        db.session.add(self)
        db.session.commit()

    def is_admin(self, poll):
        """Checks if user is an admin of poll. Returns T/F."""

        if PollAdmin.query.filter(PollAdmin.user_id == self.user_id,
                                  PollAdmin.poll_id == poll.poll_id).first():
            return True
        else:
            return False

    def may_respond(self, poll):

        if PollAdmin.query.filter(PollAdmin.user_id == self.user_id,
                                  PollAdmin.poll_id == poll.poll_id).first():
            return True
        elif poll.poll_type.collect_response:
            if Response.query.filter(Response.user_id == self.user_id,
                                         Response.poll_id == poll.poll_id).first():
                return False
            else:
                return True
        else:
            if self in poll.get_users_from_tally():
                return False
            else:
                return True

    def get_id(self):
        """Helper method required for flask_login"""
        return self.user_id

    # source: miguelgrinberg.com
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def get_from_session(session, **kwargs):
        """Queries and returns User by session_id. If None, creates User with session_id."""

        if session.get('id'):
            sid = session.get('id')
            user = User.query.filter(User.session_id == sid).one()

        else:

            sid = uuid4().hex

            # check for duplicates
            while User.query.filter(User.session_id == sid).first():
                sid = uuid4().hex

            user = User(session_id=sid)

            session['id'] = user.session_id

        if kwargs is not None:
            for attr, val in kwargs.iteritems():
                setattr(user, attr, val)

            db.session.add(user)
            db.session.commit()

        return user

    @staticmethod
    def get_from_phone(phone, **kwargs):
        user = User.query.filter(User.phone == phone).first()
        if not user:
            user = User(phone=phone)

        if kwargs is not None:
            for attr, val in kwargs.iteritems():
                setattr(user, attr, val)

            db.session.add(user)
            db.session.commit()

        return user

    @staticmethod
    def get_user():
        """Checks for user or creates one if none found."""
        if current_user.is_authenticated:
            return current_user
        else:
            return User.get_from_session(session)


class Response(db.Model):
    """Response model. Records all response data (preset options or open-ended responses) across polls."""

    __tablename__ = 'responses'

    response_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('polls.poll_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    text = db.Column(db.String(256), nullable=False)
    weight = db.Column(db.Float, nullable=False)
    is_visible = db.Column(db.Boolean, nullable=False, default=True)  # Only use if Poll.is_moderated = True
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now())
    updated_at = db.Column(db.DateTime, nullable=True)

    poll = db.relationship('Poll')  # returns Poll object
    tallys = db.relationship('Tally')  # returns list of Tally objects
    users = db.relationship('User', secondary='tallys', backref='responses')  # returns of list of all users who have selected the response

    def __repr__(self):
        return "<Response id={} poll_id={} text={} weight={}>".format(self.response_id, self.poll_id, self.text, self.weight)

    def __init__(self, poll_id, user_id, text, weight, **kwargs):
        """Create Response from poll_id, user_id, text, and weight
        and add to db."""

        self.poll_id = poll_id
        self.user_id = user_id
        self.text = text
        self.weight = weight 

        if kwargs is not None:
            for attr, val in kwargs.iteritems():
                setattr(self, attr, val)

    # TODO: Make this a SQL query
    def value(self):
        value = 0
        for tally in self.tallys:
            value += tally.value
        return value

    def data(self):
        return {'response_id' : self.response_id, 
                'user_id' : self.user_id,
                'weight' : self.weight, 
                'text' : self.text,
                'value' : Tally.query.filter(Tally.response_id == self.response_id).count(),
                'is_visible': self.is_visible}

    @staticmethod
    def get_response(poll, user):
        return Response.query.filter(Response.user_id == user.user_id,
                              Response.poll_id == poll.poll_id).first()


class Tally(db.Model):
    """Tally model. Records value input when user selects a response."""

    __tablename__ = 'tallys'

    tally_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    response_id = db.Column(db.Integer, db.ForeignKey('responses.response_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    value = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now())
    updated_at = db.Column(db.DateTime, nullable=True)

    response = db.relationship('Response')  # returns Response object

    def __repr__(self):
        return "<Tally id={}>".format(self.tally_id)

    def __init__(self, response_id, user_id, **kwargs):
        """Create Tally from response_id and user_id and add to db."""

        self.response_id = response_id
        self.user_id = user_id

        if kwargs is not None:
            for attr, val in kwargs.iteritems():
                setattr(self, attr, val)


class AdminRole(db.Model):
    """Model for admin roles."""

    __tablename__ = 'admin_roles'

    # For role permissions we can store boolean values or have a permissions column that stores dictionary

    role_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    name = db.Column(db.String(20), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now())
    updated_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return "<AdminRole id={} name={}>".format(self.role_id, self.name)


class PollAdmin(db.Model):
    """Model for poll admins."""

    __tablename__ = 'poll_admins'

    admin_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('polls.poll_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('admin_roles.role_id'), nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now())
    updated_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return "<PollAdmin id={} poll_id={} user_id={}>".format(self.admin_id, self.poll_id, self.user_id)

    def __init__(self, poll_id, user_id, **kwargs):
        """Create PollAdmin from poll_id and user_id and add to db."""
        self.poll_id = poll_id
        self.user_id = user_id

        if kwargs is not None:
            for attr, val in kwargs.iteritems():
                setattr(self, attr, val)

        db.session.add(self)
        db.session.commit()


def connect_to_db(app, db_uri='postgresql:///quippoll'):
    """Connect the database to our Flask app."""

    # Configure to use our PstgreSQL database
    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_ECHO'] = False
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.app = app
    db.init_app(app)


def example_data():
    """Create sample data for testing."""

    from seed import create_poll_types
    from seed import create_admin_roles

    create_poll_types()
    create_admin_roles()

    # Create users
    anon_user = User()
    anon_admin = User()
    admin = User(fname='Jane', lname='Doe', email='jane@mail.com',
                 password_hash='pbkdf2:sha1:1000$rOEh4Opu$117c2a9fdaca6bf2a927e5097ca7f8ce6da32307')
    user = User(fname='John', lname='Doe', email='john@mail.com',
                password_hash='pbkdf2:sha1:1000$jZyba5B5$c7da27f064ae8ec0c93d1f2e1789e9e3e19b49a3')
    user_responded = User(fname='Carly', lname='Banks', email='carly@mail.com',
                          phone='+14153334444',
                          password_hash='pbkdf2:sha1:1000$83T7iOeT$8154ddce2cd25af9688622aac45cb2054827a212')

    anon_user_responded = User(session_id='session')

    db.session.add_all([anon_user, anon_admin, admin, user, anon_user_responded])
    db.session.commit()

    # Create polls
    mc_poll = Poll(poll_type_id=1, title='Colors',
                   prompt='What is your favorite color?',
                   short_code='multi', admin_code='adminmc',
                   latitude=37.7888197,
                   longitude=-122.4116021)
    sa_poll = Poll(poll_type_id=2, title='Colors',
                   prompt='What is your favorite color?',
                   short_code='all', admin_code='adminsa',
                   is_results_visible=False)
    oe_poll = Poll(poll_type_id=3, title='Colors',
                   prompt='What is your favorite color?',
                   short_code='open', admin_code='adminoe')

    db.session.add_all([mc_poll, sa_poll, oe_poll])
    db.session.commit()

    # Create PollAdmin
    mc_admin = PollAdmin(poll_id=mc_poll.poll_id, user_id=admin.user_id)
    sa_admin = PollAdmin(poll_id=sa_poll.poll_id, user_id=admin.user_id)
    oe_admin = PollAdmin(poll_id=oe_poll.poll_id, user_id=admin.user_id)

    mc_anon_admin = PollAdmin(poll_id=mc_poll.poll_id, user_id=anon_admin.user_id)
    sa_anon_admin = PollAdmin(poll_id=sa_poll.poll_id, user_id=anon_admin.user_id)
    oe_anon_admin = PollAdmin(poll_id=oe_poll.poll_id, user_id=anon_admin.user_id)

    db.session.add_all([mc_admin, sa_admin, oe_admin, mc_anon_admin, sa_anon_admin, oe_anon_admin])
    db.session.commit

    # Create responses
    mc_r1 = Response(poll_id=mc_poll.poll_id, user_id=admin.user_id, text='Red', weight=1)
    mc_r2 = Response(poll_id=mc_poll.poll_id, user_id=admin.user_id, text='Blue', weight=2)
    mc_r3 = Response(poll_id=mc_poll.poll_id, user_id=admin.user_id, text='Yellow', weight=3)

    sa_r1 = Response(poll_id=sa_poll.poll_id, user_id=admin.user_id, text='Cyan', weight=1)
    sa_r2 = Response(poll_id=sa_poll.poll_id, user_id=admin.user_id, text='Magenta', weight=2)
    sa_r3 = Response(poll_id=sa_poll.poll_id, user_id=admin.user_id, text='Yellow', weight=3)

    oe_r1 = Response(poll_id=oe_poll.poll_id, user_id=user_responded.user_id, text='Red', weight=1)
    oe_r2 = Response(poll_id=oe_poll.poll_id, user_id=anon_user_responded.user_id, text='Blue', weight=1)

    db.session.add_all([mc_r1, mc_r2, mc_r3, sa_r1, sa_r2, sa_r3, oe_r1, oe_r2])
    db.session.commit()

    # Create Tallys
    mc_r1_t1 = Tally(response_id=mc_r1.response_id, user_id=user_responded.user_id)
    mc_r1_t2 = Tally(response_id=mc_r1.response_id, user_id=anon_user_responded.user_id)

    sa_r1_t1 = Tally(response_id=sa_r1.response_id, user_id=user_responded.user_id)
    sa_r1_t2 = Tally(response_id=sa_r1.response_id, user_id=anon_user_responded.user_id)
    sa_r2_t1 = Tally(response_id=sa_r2.response_id, user_id=anon_user_responded.user_id)
    sa_r3_t1 = Tally(response_id=sa_r3.response_id, user_id=user_responded.user_id)

    db.session.add_all([mc_r1_t1, mc_r1_t2, sa_r1_t1, sa_r1_t2, sa_r2_t1, sa_r3_t1])
    db.session.commit()


if __name__ == "__main__":
    # As a convenience, if we run this module interactively, it will leave
    # you in a state of being able to work with the database directly.

    from server import app
    connect_to_db(app)
    print "Connected to DB."
