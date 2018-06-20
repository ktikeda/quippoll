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
        self.assertIn('Create, View, Edit and Delete Live Polls.', result.data)

    def test_add_poll(self):
        result = self.client.get('/add-poll')
        self.assertEqual(result.status_code, 200)
        self.assertIn('<title>Add Poll</title>', result.data)

    def test_login(self):
        result = self.client.get('/login')
        self.assertEqual(result.status_code, 200)
        self.assertIn('<title>Login</title>', result.data)

    def test_logout(self):
        result = self.client.get('/logout', follow_redirects=True)
        self.assertEqual(result.status_code, 200)
        self.assertIn('Create, View, Edit and Delete Live Polls.', result.data)

    def test_register(self):
        result = self.client.get('/register')
        self.assertEqual(result.status_code, 200)
        self.assertIn('<title>Register</title>', result.data)

    def test_profile(self):
        result = self.client.get('/profile', follow_redirects=True)
        self.assertEqual(result.status_code, 200)
        self.assertIn('Create, View, Edit and Delete Live Polls.', result.data)

    def test_locate(self):
        result = self.client.get('/locate')
        self.assertEqual(result.status_code, 200)
        self.assertIn('Locate', result.data)



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

    def test_get_poll(self):
        """Test poll display for tally"""
        result = self.client.get('/multi')
        self.assertEqual(result.status_code, 200)
        self.assertIn('Colors: Multiple Choice', result.data)

    def test_add_user_tally_post(self):
        """Test poll input for tally"""
        pass

    def test_add_user_tally_post_hidden(self):
        """Test poll input for tally, results not visible"""
        pass

    def test_add_user_response_get(self):
        """Test poll display for response"""
        pass

    def test_add_user_response_post(self):
        """Test poll input for response"""
        pass

    def test_delete_poll_anon(self):
        """Test poll deletion failure for anonymous user"""
        pass

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
                                          'password': '123'},
                                    follow_redirects=True)

        self.assertIn('Your registration was successful.', result.data)

    def test_register_invalid(self):
        result = self.client.post('/register',
                                    data={'fname': 'Bob',
                                          'lname': 'New',
                                          'email': 'jane@mail.com', 
                                          'password': '123'},
                                    follow_redirects=True)

        self.assertIn('Sorry, a user with that email already exists.', result.data)

    def test_add_tally_poll(self):
        result = self.client.post('/add-poll',
                                  data={'title': 'Fav Num',
                                          'prompt': 'What is your fav number?',
                                          'poll_type': '1',
                                          'is_results_visible': 'True',
                                          'responses': '1\n2\n3'},
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

    def test_delete_poll(self):
        pass

    def test_delete_poll_anon(self):
        pass

    def test_delete_poll_not_admin(self):
        pass

    def test_add_tally_poll_repeat(self):
        pass

    def test_add_response_poll_repeat(self):
        pass

    def test_poll_settings(self):
        pass

    def test_poll_settings_not_admin(self):
        result = self.client.get('/polls/1/settings', follow_redirects=True)
        self.assertEqual(result.status_code, 200)
        self.assertIn('Create, View, Edit and Delete Live Polls.', result.data)

    def test_update_poll_settings(self):
        result = self.client.post('/api/polls/1',
                                  data={'title': 'My Colors'})
        self.assertIn('My Colors', result.data)

    def test_update_poll_settings_bad_short_code(self):
        result = self.client.post('/api/polls/1',
                                  data={'short_code': 'open'})
        self.assertIn('This short code is already in use.', result.data)

    def test_locate(self):
        result = self.client.post('/locate',
                                  data={'latitude': '37.7888197',
                                        'longitude': '-122.4116021'},
                                  follow_redirects=True)
        self.assertEqual(result.status_code, 200)
        self.assertIn('/multi', result.data)

    def test_locate_lat_fail(self):
        result = self.client.post('/locate',
                                  data={'latitude': '38.7888197',
                                        'longitude': '-122.4116021'},
                                  follow_redirects=True)
        self.assertEqual(result.status_code, 200)
        self.assertIn('/locate', result.data)

    def test_locate_long_fail(self):
        result = self.client.post('/locate',
                                  data={'latitude': '37.7888197',
                                        'longitude': '-123.4116021'},
                                  follow_redirects=True)
        self.assertEqual(result.status_code, 200)
        self.assertIn('/locate', result.data)

    def test_locate_multiple(self):
        pass


class TwilioTests(TestCase):
    """Tests Twilio API routes."""

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

    def test_find_poll(self):
        result = self.client.post('/sms',
                          data={'From': '+14153330000',
                                'Body': 'multi'})
        self.assertIn('/sms/multi', result.data)

    def test_find_poll_fail(self):
        result = self.client.post('/sms',
                          data={'From': '+14153330000',
                                'Body': 'bad'})
        self.assertIn('That poll does not exist', result.data)

    def test_redirect_input(self):
        with self.client as c:
          with c.session_transaction() as sess:
              sess['short_code'] = 'multi'
        result = self.client.post('/sms',
                          data={'From': '+14153330000',
                                'Body': 'multi'})
        self.assertIn('/sms/multi/input', result.data)

    def test_all_continue_true(self):
        with self.client as c:
          with c.session_transaction() as sess:
              sess['short_code'] = 'all'
        result = self.client.post('/sms',
                          data={'From': '+14153330000',
                                'Body': 'y'})
        self.assertIn('/sms/all', result.data)

    def test_all_continue_false(self):
        with self.client as c:
          with c.session_transaction() as sess:
              sess['short_code'] = 'all'
        result = self.client.post('/sms',
                          data={'From': '+14153330000',
                                'Body': 'No'})
        self.assertIn('Thank you for responding.', result.data)

    def test_all_continue_fail(self):
        with self.client as c:
          with c.session_transaction() as sess:
              sess['short_code'] = 'all'
        result = self.client.post('/sms',
                          data={'From': '+14153330000',
                                'Body': 'bad'})
        self.assertIn('Please type "Y" for Yes or "N" for No.', result.data)

    def test_multi_prompt(self):
        result = self.client.post('/sms/multi',
                          data={'From': '+14153330000',
                                'Body': 'multi'})
        self.assertIn('Enter # of response option.', result.data)


    def test_multi_input(self):
        result = self.client.post('/sms/multi/input',
                          data={'From': '+14153330000',
                                'Body': '1'})
        self.assertIn('Your response "Red" has been recorded.', result.data)

    def test_multi_bad_num(self):
        result = self.client.post('/sms/multi/input',
                          data={'From': '+14153330000',
                                'Body': '5'})
        self.assertIn('Sorry that response does not exist. Please enter another number.', result.data)

    def test_multi_not_num(self):
        result = self.client.post('/sms/multi/input',
                          data={'From': '+14153330000',
                                'Body': 'A'})
        self.assertIn('Sorry, please enter your response option as a number.', result.data)

    def test_open_prompt(self):
        result = self.client.post('/sms/open',
                          data={'From': '+14153330000',
                                'Body': 'open'})
        self.assertIn('Enter your response.', result.data)

    def test_open_input(self):
        with self.client as c:
          with c.session_transaction() as sess:
              sess['short_code'] = 'open'

        result = self.client.post('/sms/open/input',
                          data={'From': '+14153330000',
                                'Body': 'Purple'})
        self.assertIn('Your response "Purple" has been recorded.', result.data)

    def test_all_input(self):
        result = self.client.post('/sms/all/input',
                          data={'From': '+14153334444',
                                'Body': '2'})
        self.assertIn('Your response "Magenta" has been recorded.', result.data)
        self.assertIn('Continue responding? Y/N', result.data)

    def test_multi_user_responded(self):
        result = self.client.post('/sms/multi',
                          data={'From': '+14153334444',
                                'Body': 'multi'})
        self.assertIn('You have already submitted a response.', result.data)

    def test_open_user_responded(self):
        result = self.client.post('/sms/open',
                          data={'From': '+14153334444',
                                'Body': 'open'})
        self.assertIn('You have already submitted a response.', result.data)

    def test_all_user_responded(self):
        result = self.client.post('/sms/all/input',
                          data={'From': '+14153334444',
                                'Body': '1'})
        self.assertIn('You have already responsed for "Cyan".', result.data)


if __name__ == "__main__":
    unittest.main()
