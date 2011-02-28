import logging, settings
from src.handler.api import ApiHandler
from src.model import Message
from src.service import chatroomservice, channelservice
from src.utils import stringutils

class TalkHandler(ApiHandler):
    
    def onApiRequest(self):
		id = self.param(settings.CHATROOM_ID_PARAM)
		if stringutils.isNotEmpty(id):
			chatroom = chatroomservice.getChatroom(id)
			if chatroom is not None:
				token = self.param(settings.TOKEN_PARAM)
				if stringutils.isNotEmpty(token):
					if channelservice.isValidToken(id, token, active=True):
						chat = self.param(settings.CHAT_MESSAGE_PARAM, "",
							settings.MESSAGE_CHARACTER_LIMIT, sanitize=True)
						alias = self.param(settings.CHAT_ALIAS_PARAM, settings.DEFAULT_CHAT_ALIAS,
							settings.ALIAS_CHARACTER_LIMIT, sanitize=True)
						message = Message(alias, chat)
						chatroom.addMessage(message)
						chatroomservice.cacheAndEnqueueSave(chatroom)
						status = channelservice.sendMessage(id, token, message)
						self.sendApiResponse(status)
					else:
						self.sendApiError('expired token', 401, {'expired':True})
				else:
					self.sendApiError('missing access token', 401)
			else:
				self.sendApiError('chatroom does not exist', 404)
		else:
			self.sendApiError('missing chatroom id', 401)