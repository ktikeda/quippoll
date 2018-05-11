import unittest
import server
from unittest import TestCase
from app import app
from model import db, connect_to_db, example_data
from model import PollType, Poll, User, Response, Tally, AdminRole, PollAdmin
from flask_login import current_user, login_user, logout_user
from flask import session


class GetRouteTests(TestCase):
    """Test routes with GET request"""

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

    def tearDown(self):
        pass


class DBRouteTests(TestCase):
    """Tests routes with POST requests."""

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

    def test_bad_route(self):
        """Test route that does not exist"""
        result = self.client.get('/badroute', follow_redirects=True)
        self.assertEqual(result.status_code, 200)
        self.assertIn('Sorry, that page does not exist.', result.data)

    def test_add_user_tally(self):
        """"""
        result = self.client.get('/multi')
        self.assertEqual(result.status_code, 200)
        self.assertIn('Red', result.data)
        self.assertIn('Blue', result.data)
        self.assertIn('Yellow', result.data)

    def test_add_user_response(self):
        """"""
        result = self.client.get('/open')
        # self.assertEqual(result.status_code, 200)
        self.assertIn('<input type="text" id="response" name="response">', result.data)

    def test_login_valid(self):
        result = self.client.post('/login', 
                                    data={ 'email': 'jane@mail.com', 
                                           'password': '123' },
                                    follow_redirects=True)

        self.assertIn('You are logged in.', result.data)

    def test_login_pw_invalid(self):
        result = self.client.post('/login', 
                                    data={ 'email': 'jane@mail.com', 
                                           'password': 'abc' },
                                    follow_redirects=True)

        self.assertIn('Invalid email or password.', result.data)

    def test_login_user_invalid(self):
        result = self.client.post('/login', 
                                    data={ 'email': 'joe@mail.com', 
                                           'password': 'abc' },
                                    follow_redirects=True)

        self.assertIn('Invalid email or password.', result.data)

    def test_register_valid(self):
        result = self.client.post('/register', 
                                    data={'fname': 'Bob',
                                          'lname': 'New',
                                          'email': 'new@mail.com', 
                                          'password': '123' },
                                    follow_redirects=True)

        self.assertIn('Your registration was successful.', result.data)

    def test_register_invalid(self):
        result = self.client.post('/register', 
                                    data={'fname': 'Bob',
                                          'lname': 'New',
                                          'email': 'jane@mail.com', 
                                          'password': '123' },
                                    follow_redirects=True)

        self.assertIn('Sorry, a user with that email already exists.', result.data)

    def test_add_tally_poll(self):
        result = self.client.post('/add-poll', 
                                  data={'title': 'Fav Num',
                                          'prompt': 'What is your fav number?',
                                          'poll_type': '1', 
                                          'is_results_visible': 'True',
                                          'responses': '1\n2\n3' },
                                  follow_redirects=True)
        self.assertIn('What is your fav number?', result.data)

    def test_add_response_poll(self):
        result = self.client.post('/add-poll', 
                                  data={'title': 'Fav Num',
                                          'prompt': 'What is your fav number?',
                                          'poll_type': '3', 
                                          'is_results_visible': 'True'},
                                  follow_redirects=True)
        self.assertIn('What is your fav number?', result.data)


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
