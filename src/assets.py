#!/usr/bin/env python
import settings
from src.handler import asset
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import webapp

assetServer = webapp.WSGIApplication([
	('/assets/template', asset.TemplateHandler),
	('/assets/font', asset.FontHandler),
	(r'/assets/.*', asset.MissingHandler)
], debug=settings.IS_DEV_MODE)

if __name__ == '__main__':
    run_wsgi_app(assetServer)