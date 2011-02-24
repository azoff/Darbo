import logging, settings
from google.appengine.ext import webapp
from src.service import chatroomservice, channelservice
from src.model import Chatroom, JsonResponse

class JoinHandler(webapp.RequestHandler):
    
	def get(self):
		participants = 0
		id = chatroomservice.getIdFromRequest(self.request)
		token = channelservice.getTokenFromRequest(self.request)
		name = chatroomservice.getNameFromRequest(self.request)
		response = JsonResponse(self.request, self.response)
		chatroom = None
		
		if id is not None:
			chatroom = chatroomservice.getChatroom(id)
			if chatroom is None: # check for bad IDs
				id = None
		if id is None:
			id = chatroomservice.getIdFromReferrer(self.request.referrer)
		
		if id is not None:
			chatroom = chatroomservice.getChatroom(id)
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
				'participants': participants,
				'settings': settings.getSettings()
			})
		else:
			response.encodeAndSend({'error': 'invalid or missing referrer'}, status=401)
		
	def post(self):
		self.get()