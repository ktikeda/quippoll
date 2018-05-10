from flask import Flask
app = Flask(__name__)

from flask_login import LoginManager
login = LoginManager(app)
# Setup login manager
login.init_app(app)
login.login_view = "login"

from jinja2 import StrictUndefined

app.jinja_env.undefined = StrictUndefined
app.jinja_env.auto_reload = True

app.secret_key = "secret"