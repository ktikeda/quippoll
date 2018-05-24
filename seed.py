# from sqlalchemy import func
from model import connect_to_db, db
from model import PollType, Poll, User, Response, Tally, AdminRole, PollAdmin


def create_poll_types():
    """Create default poll types for all polls"""

    multi_choice = PollType(name='multiple choice',
                            collect_response=False,
                            collect_tally=True,
                            multi_select=False)

    select_all = PollType(name='select all',
                          collect_response=False,
                          collect_tally=True,
                          multi_select=True)

    open_ended = PollType(name='open-ended',
                          collect_response=True,
                          collect_tally=False,
                          multi_select=False)

    db.session.add_all([multi_choice, select_all, open_ended])
    db.session.commit()


def create_admin_roles():
    """Create default admin roles for all users"""

    creator = AdminRole(name='creator',
                        description='Creator of poll. User has all permissions.')
    super_admin = AdminRole(name='super administrator',
                            description='User has all permissions.')
    editor = AdminRole(name='editor',
                       description='User can edit all poll text, but cannot change settings.')
    moderator = AdminRole(name='moderator',
                          description='User can moderator responses.')

    db.session.add_all([creator, super_admin, editor, moderator])
    db.session.commit()


def test_data():
    """Create sample data for testing."""

    # Create users
    anon_user = User()
    anon_admin = User()
    admin = User(fname='Karynn', lname='Ikeda', email='admin',
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
    from app import app
    connect_to_db(app)

    # In case tables haven't been created, create them
    db.create_all()
    print "Created tables"

    # Import different types of data
    create_poll_types()
    print "Added poll types"
    create_admin_roles()
    print "Added admin roles"
    test_data()
    print "Added test data"
