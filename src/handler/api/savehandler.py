import logging, settings
from src.handler.api import ApiHandler
from src.model import ChatroomFromJson
from src.service import chatroomservice, channelservice
from src.utils import stringutils
from time import time

class SaveHandler(ApiHandler):
    
	def onApiRequest(self):
		chatroomJson = self.param(settings.CHATROOM_JSON_PARAM)
		if stringutils.isNotEmpty(chatroomJson):
			chatroom = ChatroomFromJson(chatroomJson)
			if chatroom is not None:
				chatroomservice.saveChatroom(chatroom)
				self.sendApiResponse({
					settings.CHATROOM_ID_PARAM: chatroom.getId(), 
					'complete': time()
				})
			else:
				self.sendApiError('invalid chatroom JSON', 401)
		else:
			self.sendApiError('missing chatroom data', 402)