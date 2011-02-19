import logging
from google.appengine.ext import webapp
from src.service import chatroomservice, channelservice
from src.model import Chatroom, JsonResponse

class JoinHandler(webapp.RequestHandler):
    
	def get(self):
		id = chatroomservice.getIdFromRequest(self.request)
		token = channelservice.getTokenFromRequest(self.request)
		recipientCount = 0
		response = JsonResponse(self.request, self.response)
		if id is not None:        
			chatroom = chatroomservice.getChatroom(id)
			if chatroom is None:
				chatroom = Chatroom(id)
				# synchronous save on chatroom
				chatroomservice.saveChatroom(chatroom)
			if token is None or not channelservice.isValidToken(id, token):
				token, recipientCount = channelservice.createToken(id)
			else:
				recipientCount = channelservice.getRecipientCount(id)
			response.encodeAndSend({
				'token': token,
				'chatroom': chatroom.asLiteral(),
				'recipientCount': recipientCount
			})
		else:
			response.encodeAndSend({'error': 'no referrer detected, and no id provided'}, status=500)