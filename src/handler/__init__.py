import settings

from google.appengine.ext import webapp

from joinhandler import JoinHandler
from talkhandler import TalkHandler
from leavehandler import LeaveHandler
from savehandler import SaveHandler
from sessionhandler import SessionHandler
from unknownhandler import UnknownHandler

WsgiChatApp = webapp.WSGIApplication([
	('/api/join', JoinHandler),
	('/api/talk', TalkHandler),
	('/api/leave', LeaveHandler),
	('/api/save', SaveHandler),
	('/api/session', SessionHandler),
	(r'/api/.*', UnknownHandler)
], debug=settings.IS_DEV_MODE)