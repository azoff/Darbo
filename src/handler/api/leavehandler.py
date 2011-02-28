import logging, settings
from src.handler.api import ApiHandler
from src.service import chatroomservice, channelservice
from src.utils import stringutils

class LeaveHandler(ApiHandler):
    
    def onApiRequest(self):
		id = self.param(settings.CHATROOM_ID_PARAM)
		token = self.param(settings.TOKEN_PARAM)
		if stringutils.isNotEmpty(token):
			participants = channelservice.deactivateToken(id, token)
			channelservice.updateParticipantCount(id, token)
			self.sendApiResponse({'participants': participants});
		else:
			self.sendApiError('missing token', 401)