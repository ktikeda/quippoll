import unittest
import server
from unittest import TestCase
from app import app
from model import db, connect_to_db, example_data
from model import PollType, Poll, User, Response, Tally, AdminRole, PollAdmin


class FlaskTests(TestCase):

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

    def tearDown(self):
        pass

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
