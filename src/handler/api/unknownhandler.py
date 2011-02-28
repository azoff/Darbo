from src.handler.api import ApiHandler

class UnknownHandler(ApiHandler):
    
	def onApiRequest(self):
		self.sendApiError('unknown action', 404)