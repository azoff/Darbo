import settings

from google.appengine.ext import webapp

from joinhandler import JoinHandler
from talkhandler import TalkHandler
from indexhandler import IndexHandler
from savehandler import SaveHandler

WsgiChatApp = webapp.WSGIApplication([
    ('/join', JoinHandler),
    ('/talk', TalkHandler),
    ('/save', SaveHandler),
    ('/', IndexHandler)
], debug=settings.IS_DEV_MODE)