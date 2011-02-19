import settings
from google.appengine.ext import webapp
from src.model import JsonResponse
from src.service import chatroomservice, channelservice

class LeaveHandler(webapp.RequestHandler):
    
    def get(self):
		id = chatroomservice.getIdFromRequest(self.request)
		token = channelservice.getTokenFromRequest(self.request)
		response = JsonResponse(self.request, self.response)
		if token is not None:
			recipientCount = channelservice.reclaimToken(id, token)
			return response.encodeAndSend({'recipientCount': recipientCount});
		else:
			response.encodeAndSend({'error': 'missing token'}, status=401)