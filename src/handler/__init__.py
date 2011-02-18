import settings

from google.appengine.ext import webapp

from joinhandler import JoinHandler
from talkhandler import TalkHandler
from savehandler import SaveHandler

WsgiChatApp = webapp.WSGIApplication([
    ('/api/join', JoinHandler),
    ('/api/talk', TalkHandler),
    ('/api/save', SaveHandler)
], debug=settings.IS_DEV_MODE)