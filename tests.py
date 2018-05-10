from unittest import TestCase
import unittest
import server
from app import app
from model import db, connect_to_db
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

if __name__ == "__main__":
    unittest.main()
