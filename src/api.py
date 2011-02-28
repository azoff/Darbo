#!/usr/bin/env python
import settings
from src.handler import api
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import webapp

apiServer = webapp.WSGIApplication([
	('/api/join', api.JoinHandler),
	('/api/talk', api.TalkHandler),
	('/api/leave', api.LeaveHandler),
	('/api/save', api.SaveHandler),
	(r'/api/.*', api.UnknownHandler)
], debug=settings.IS_DEV_MODE)

if __name__ == '__main__':
    run_wsgi_app(apiServer)
