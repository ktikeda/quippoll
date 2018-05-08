from flask_sqlalchemy import SQLAlchemy
from uuid import uuid4
from datetime import datetime

db = SQLAlchemy()


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
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=True)

    polls = db.relationship('Poll')  # returns a list of all polls with poll type

    def __repr__(self):
        return "<Poll Type id={} name={}>".format(self.poll_type_id, self.name)


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
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=True)

    responses = db.relationship('Response')  # returns a list of Response objects
    poll_type = db.relationship('PollType')  # returns PollType object

    def __repr__(self):
        return "<Poll id={} poll_type_id={} title={}>".format(self.poll_id, self.poll_type_id, self.title)

    @staticmethod
    def get_from_code(short_code):
        return Poll.query.filter(Poll.short_code == short_code).one()


class User(db.Model):
    """User model."""

    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    fname = db.Column(db.String(20), nullable=True)
    lname = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    password = db.Column(db.String(20), nullable=True)
    session_id = db.Column(db.String(32), nullable=True)
    twitter = db.Column(db.String(20), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=True)

    polls = db.relationship('Poll', secondary='poll_admins', backref='admins')  # returns a list of polls administered by user


    def __repr__(self):
        return "<User id={}>".format(self.user_id)

    @staticmethod
    def get_from_session(session):
        if session.get('id'):
            sid = session.get('id')
            user = User.query.filter(User.session_id == sid).one()
        else:
            user = User(created_at=datetime.now(), session_id=uuid4().hex)
            session['id'] = user.session_id
            db.session.add(user)
            db.session.commit()
        return user


class Response(db.Model):
    """Response model. Records all response data (preset options or open-ended responses) across polls."""

    __tablename__ = 'responses'

    response_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('polls.poll_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    text = db.Column(db.String(256), nullable=False)
    order = db.Column(db.Integer, nullable=False)
    is_visible = db.Column(db.Boolean, nullable=False, default=True)  # Only use if Poll.is_moderated = True
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=True)

    poll = db.relationship('Poll')  # returns Poll object
    tallys = db.relationship('Tally')  # returns list of Tally objects
    users = db.relationship('User', secondary='tallys', backref='responses')  # returns of list of all users who have selected the response

    def __repr__(self):
        return "<Response id={} poll_id={} text={}>".format(self.response_id, self.poll_id, self.text)

    def value(self):
        value = 0
        for tally in self.tallys:
            value += tally.value
        return value


class Tally(db.Model):
    """Tally model. Records value input when user selects a response."""

    __tablename__ = 'tallys'

    tally_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    response_id = db.Column(db.Integer, db.ForeignKey('responses.response_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    value = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=True)

    response = db.relationship('Response')  # returns Response object

    def __repr__(self):
        return "<Tally id={}>".format(self.tally_id)


class AdminRole(db.Model):
    """Model for admin roles."""

    __tablename__ = 'admin_roles'

    role_id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    name = db.Column(db.String(20), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
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
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return "<PollAdmin id={} poll_id={} user_id={}>".format(self.admin_id, self.poll_id, self.user_id)


def connect_to_db(app):
    """Connect the database to our Flask app."""

    # Configure to use our PstgreSQL database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///quippoll'
    app.config['SQLALCHEMY_ECHO'] = False
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.app = app
    db.init_app(app)


if __name__ == "__main__":
    # As a convenience, if we run this module interactively, it will leave
    # you in a state of being able to work with the database directly.

    from server import app
    connect_to_db(app)
    print "Connected to DB."
