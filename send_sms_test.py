import os
from twilio.rest import Client
# import twilio.rest

account_sid = os.environ['TWILIO_ACCOUNT_SID']
auth_token = os.environ['TWILIO_AUTHTOKEN']
client = Client(account_sid, auth_token)

message = client.messages.create(
                              body="Test",
                              from_="+16288000602",
                              to="+19166061406"
                          )


print(message.sid)
