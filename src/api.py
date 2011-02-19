#!/usr/bin/env python

from google.appengine.ext.webapp.util import run_wsgi_app
from src.handler import WsgiChatApp

if __name__ == '__main__':
    run_wsgi_app(WsgiChatApp)
