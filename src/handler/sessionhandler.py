import settings
from django.utils import simplejson
from google.appengine.ext import webapp
from google.appengine.api import taskqueue
from src.service import chatroomservice, channelservice
from src.model import Chatroom, Message, JsonResponse

class SessionHandler(webapp.RequestHandler):
    
	def get(self):
		id = chatroomservice.getIdFromRequest(self.request)
		token = channelservice.getTokenFromRequest(self.request)
		response = JsonResponse(self.request, self.response)
		session = channelservice.getSession(id, token)
		if session is not None:
			response.encodeAndSend(session.asLiteral())
		else:
			response.encodeAndSend({'error': 'invalid token'}, status=401)