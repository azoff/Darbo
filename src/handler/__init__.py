import settings

from google.appengine.ext import webapp

from joinhandler import JoinHandler
from talkhandler import TalkHandler
from savehandler import SaveHandler

WsgiChatApp = webapp.WSGIApplication([
    ('/join', JoinHandler),
    ('/talk', TalkHandler),
    ('/save', SaveHandler)
], debug=settings.IS_DEV_MODE)