from sqlalchemy import func
from model import PollType, Poll, User, Response, Tally, AdminRole, PollAdmin
from model import connect_to_db, db
from server import app
from datetime import datetime

def create_poll_types():
    """Create default poll types for all polls"""
    
    multi_choice = PollType(name='multiple choice', collect_response=False, 
        collect_tally=True, multi_select=False, created_at=datetime.now())

    select_all = PollType(name='select all', collect_response=False, 
        collect_tally=True, multi_select=True, created_at=datetime.now())

    open_ended = PollType(name='open-ended', collect_response=True, 
        collect_tally=False, multi_select=False, created_at=datetime.now())

    db.session.add_all(multi_choice, select_all, open_ended)
    db.session.commit()


def create_admin_roles():
    """Create default admin roles for all users"""

    creator = AdminRole(name='creator', description='Creator of poll. User has all permissions.', created_at=datetime.now())
    super_admin = AdminRole(name='super administrator', created_at=datetime.now(), description='User has all permissions.')
    editor = AdminRole(name='editor', created_at=datetime.now(), description='User can edit all poll text, but cannot change settings.')
    moderator = AdminRole(name='moderator', created_at=datetime.now(), description='User can moderator responses.')

    db.session.add_all(creator, super_admin, editor, moderator)
    db.session.commit()


if __name__ == "__main__":
    connect_to_db(app)

    # In case tables haven't been created, create them
    db.create_all()
    print "Created tables"

    # Import different types of data
    create_poll_types()
    print "Added poll types"
    create_admin_roles()
    print "Added admin roles"