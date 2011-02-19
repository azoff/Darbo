import settings
from django.utils import simplejson
from google.appengine.ext import webapp
from google.appengine.api import taskqueue
from src.service import chatroomservice, channelservice
from src.model import Chatroom, Message, JsonResponse

class UnknownHandler(webapp.RequestHandler):
    
	def get(self):
		response = JsonResponse(self.request, self.response)
		response.encodeAndSend({'error': 'unknown action'}, status=404)