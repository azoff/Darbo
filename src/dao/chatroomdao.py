from google.appengine.ext import db

class ChatroomDao(db.Model):
    json = db.StringProperty(required=True)