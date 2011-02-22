import settings
from django.utils import simplejson
from google.appengine.ext import webapp
from google.appengine.api import taskqueue
from src.service import chatroomservice, channelservice
from src.model import Chatroom, JsonResponse

class TalkHandler(webapp.RequestHandler):
    
    def get(self):
		id = chatroomservice.getIdFromRequest(self.request)
		chatroom = chatroomservice.getChatroom(id)
		response = JsonResponse(self.request, self.response)
		if chatroom is not None:
			token = channelservice.getTokenFromRequest(self.request)
			if token is not None:
				if channelservice.isValidToken(id, token, active=True):
					msg = chatroomservice.getMessageFromRequest(self.request)
					# TODO: make this a job, it might stall the service to have this be synchronous
					msgJson = channelservice.sendMessage(id, token, msg)
					chatroom.addMessage(msg)
					chatroomservice.cacheAndEnqueueSave(chatroom)
					response.encodeAndSend(msgJson)
				else:
					response.encodeAndSend({'error': "invalid or expired token", 'expired': True}, status=401)
			else:
				response.encodeAndSend({'error': "missing required token parameter"}, status=401)
		else:
			response.encodeAndSend({'error': "chatroom does not exist"}, status=404)