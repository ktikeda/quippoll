# Config Flask
from flask import Flask
app = Flask(__name__)
app.secret_key = "secret"

# Config Flask-login
from flask_login import LoginManager
login = LoginManager(app)
login.init_app(app)

# Config Jinja
from jinja2 import StrictUndefined

app.jinja_env.undefined = StrictUndefined
app.jinja_env.auto_reload = True

# Config Flask-SocketIO
from flask_socketio import SocketIO
from threading import Lock
async_mode = None
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock()

# Allow regex in routes via https://stackoverflow.com/questions/5870188/does-flask-support-regular-expressions-in-its-url-routing
from werkzeug.routing import BaseConverter
class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]

app.url_map.converters['regex'] = RegexConverter
app.url_map.strict_slashes = False
