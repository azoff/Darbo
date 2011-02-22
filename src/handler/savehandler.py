import settings, logging
from django.utils import simplejson
from google.appengine.ext import webapp
from src.service import chatroomservice
from src.model import Chatroom, Message, JsonResponse, MessageFromJson

class SaveHandler(webapp.RequestHandler):
    
	def post(self):
		chatroom = chatroomservice.getChatroomFromRequest(self.request)
		response = JsonResponse(self.request, self.response)
		if chatroom is not None:
			chatroomservice.saveChatroom(chatroom)
			response.encodeAndSend(chatroom.asLiteral())
		else:
			response.encodeAndSend({'error': "invalid chatroom"}, status=401)