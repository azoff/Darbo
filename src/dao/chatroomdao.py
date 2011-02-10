from google.appengine.ext import db

class ChatroomDao(db.Model):
    id   = db.StringProperty(indexed=True,required=True)
    json = db.StringProperty(required=True)