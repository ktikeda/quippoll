import unittest
import server
from unittest import TestCase
from app import app
from model import db, connect_to_db, example_data
from model import PollType, Poll, User, Response, Tally, AdminRole, PollAdmin
from flask_login import current_user, login_user, logout_user


class RouteAnonymousTests(TestCase):
    """Tests routes for anonymous users."""
    
    # Test routes with GET request
    def setUp(self):
        self.client = server.app.test_client()
        app.config['TESTING'] = True

    def test_index(self):
        result = self.client.get('/')
        self.assertEqual(result.status_code, 200)
        self.assertIn('Gather input in a snap.', result.data)

    def test_add_poll(self):
        result = self.client.get('/add-poll')
        self.assertEqual(result.status_code, 200)
        self.assertIn('<h1>Add Poll</h1>', result.data)

    def test_login(self):
        result = self.client.get('/login')
        self.assertEqual(result.status_code, 200)
        self.assertIn('<h1>Login</h1>', result.data)

    def test_logout(self):
        result = self.client.get('/logout', follow_redirects=True)
        self.assertEqual(result.status_code, 200)
        self.assertIn('Gather input in a snap.', result.data)

    def test_register(self):
        result = self.client.get('/register')
        self.assertEqual(result.status_code, 200)
        self.assertIn('<h1>Register</h1>', result.data)

    def test_profile(self):
        result = self.client.get('/profile', follow_redirects=True)
        self.assertEqual(result.status_code, 200)
        self.assertIn('Gather input in a snap.', result.data)

    # Test routes with POST request
    # def test_add_poll_to_db(self):
    #     result = self.client.post('/add-poll', data={'title': 'Numbers'})
    #     self.assertEqual(result.status_code, 200)

    def tearDown(self):
        pass

from contextlib import contextmanager
from flask import appcontext_pushed, session

@contextmanager
def login_set(app, user):
    def handler(sender, **kwargs):
        login_user(user)
        print current_user
        print "Authenticated", current_user.is_authenticated
    with appcontext_pushed.connected_to(handler, app):
        yield

class RouteAuthenticatedTests(TestCase):
    """Tests routes for authenticated users."""

    # Test routes with GET request
    

    def setUp(self):
        self.client = server.app.test_client()
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'key'

        connect_to_db(app, "postgresql:///testdb")
        db.create_all()
        example_data()


    def tearDown(self):
        """Do at end of every test."""

        db.session.close()
        db.drop_all()

    def test_index(self):
        user = User(fname='Karynn')
        db.session.add(user)
        db.session.commit()

        with app.test_request_context('/'):
            login_user(user)
            print session
            print current_user
            print 'is_authenticated', current_user.is_authenticated
            result = self.client.get('/')
            # self.assertEqual(result.status_code, 200)
            # self.assertIn('Karynn', result.data)

    def test_login(self):
        with self.client:
            response = self.client.post('/login', { 'email': 'jane@mail.com', 'password': '123' })

            # success
            assertEquals(current_user.fname, 'Jane')



class FlaskTestsDatabase(TestCase):

    def setUp(self):
        """Execute before each test"""
        # Connect to test database
        connect_to_db(app, "postgresql:///testdb")

        # Create tables and add sample data
        db.create_all()
        example_data()

    def tearDown(self):
        """Do at end of every test."""

        db.session.close()
        db.drop_all()




if __name__ == "__main__":
    unittest.main()
