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
        result = self.client.get('/')
        self.assertEqual(result.status_code, 200)
        
        print current_user


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
