import settings
from src.handler import BaseHandler, HandlerException
from src.utils import stringutils
from django.utils import simplejson

class ApiHandler(BaseHandler):
	
	def onRequest(self):
		self._jsonp = self.param(settings.JSONP_CALLBACK_PARAM)
		self.onApiRequest()
	
	def onApiRequest(self):
		raise HandlerException("You need to implement ApiHandler::onApiRequest()");
		
	def sendApiError(self, error, status, extraData=None):
		if extraData is None:
			extraData = {}
		extraData['error'] = error
		self.sendApiResponse(extraData, status)
		
	def sendApiResponse(self, data, status=200):
		# The response body in CORS requests is ignored by browsers if the status code is not 200
		# As a result, we always return 200 and add the status to the response json
		data['status'] = status
		json = simplejson.dumps(data)
		if stringutils.isNotEmpty(self._jsonp):
			self.setContentType('application/javascript')
			json = "%s(%s);" % (self._jsonp, json)
		else:
			self.setContentType('application/json')
		self.send(json)