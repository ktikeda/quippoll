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
