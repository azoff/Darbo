import logging, settings
from src.handler.api import ApiHandler
from src.service import chatroomservice, channelservice
from src.model import Chatroom
from src.utils import stringutils

class JoinHandler(ApiHandler):
    
	def onApiRequest(self):
		id = self.param(settings.CHATROOM_ID_PARAM)
		token = self.param(settings.TOKEN_PARAM)
		name = self.param(settings.CHATROOM_NAME_PARAM, "", settings.ROOM_NAME_CHARACTER_LIMIT, True)
		participants = 0
		chatroom = None
		
		if stringutils.isNotEmpty(id):
			chatroom = chatroomservice.getChatroom(id)
			if chatroom is None: # check for bad IDs
				id = None
		if stringutils.isEmpty(id):
			id = chatroomservice.getIdFromUrl(self.request.referrer)
		
		if stringutils.isNotEmpty(id):
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
			self.sendApiResponse({
				'token': token,
				'chatroom': chatroom.asLiteral(),
				'participants': participants,
				'settings': settings.getClientSettings()
			})
		else:
			self.sendApiError('invalid or missing referrer', 401)