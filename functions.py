from model import PollType, Poll, User, Response, Tally, AdminRole, PollAdmin

def get_poll_from_code(short_code):
    return Poll.query.filter(Poll.short_code == short_code).one()