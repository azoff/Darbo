import logging
from google.appengine.ext import webapp
from src.service import chatroomservice, channelservice
from src.model import Chatroom, JsonResponse

class JoinHandler(webapp.RequestHandler):
    
	def get(self):
		id = chatroomservice.getIdFromRequest(self.request)
		token = channelservice.getTokenFromRequest(self.request)
		participants = 0
		response = JsonResponse(self.request, self.response)
		if id is not None:        
			chatroom = chatroomservice.getChatroom(id)
			name = chatroomservice.getNameFromRequest(self.request)
			persist = False
			if chatroom is None:
				chatroom = Chatroom(id, name)
				chatroomservice.cacheAndEnqueueSave(chatroom)
			elif len(name) > 0 and (name != chatroom.getName()):
				chatroom.setName(name)
				chatroomservice.cacheAndEnqueueSave(chatroom)
			if channelservice.isValidToken(id, token):
				participants = channelservice.activateToken(id, token)
			else:
				token, participants = channelservice.createToken(id)
			channelservice.updateParticipantCount(id, token)
			response.encodeAndSend({
				'token': token,
				'chatroom': chatroom.asLiteral(),
				'participants': participants
			})
		else:
			response.encodeAndSend({'error': 'no referrer detected, and no id provided'}, status=500)