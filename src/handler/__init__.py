import settings

from google.appengine.ext import webapp

from joinhandler import JoinHandler
from listenhandler import ListenHandler
from talkhandler import TalkHandler
from indexhandler import IndexHandler

WsgiChatApp = webapp.WSGIApplication([
    ('/join', JoinHandler),
    ('/listen', ListenHandler), 
    ('/talk', TalkHandler),
    ('/', IndexHandler)
], debug=settings.IS_DEV_MODE)