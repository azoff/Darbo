import settings, logging
from src.utils import htmlutils, stringutils
from google.appengine.ext import webapp

class BaseHandler(webapp.RequestHandler):
	
	def onRequest(self):
		raise HandlerException("You need to implement BaseHandler::onRequest()");
	
	def options(self):
		self.applyCrossOriginResourceSharing(preflight=True)
	
	def get(self):
		self.post()

	def post(self):
		self.applyCrossOriginResourceSharing()
		self.onRequest()
		
	def applyCrossOriginResourceSharing(self, preflight=False):
		if self.hasHeader('Origin') and self.isValidCrossOriginRequest():
			origin = self.header('Origin')
			self.addHeader('Access-Control-Allow-Origin', origin)
			if preflight:
				self.addHeader('Access-Control-Allow-Methods',
					settings.CROSS_DOMAIN_METHODS)
				self.addHeader('Access-Control-Allow-Headers',
					self.header('Access-Control-Request-Headers')) # this may be unsafe...
				self.addHeader('Access-Control-Max-Age',
					settings.CROSS_DOMAIN_WINDOW)
		
	def isValidCrossOriginRequest(self):
		#TODO: By default we don't verify that CORS requests are valid
		#      This eventually needs to be validated by an API Key by
		#      Overriding in a subclass
		return True

	def getAcceptedLocales(self):
		locales = self.header('Accept-Language').split(',')
		normalizedLocales = []
		for locale in locales:
			localeParts = locale.split('-');
			localeParts[0] = localeParts[0].lower();
			if len(localeParts) > 1:
				localeGroup = localeParts[1].split(';')
				localeParts[1] = localeGroup[0].upper()
				normalizedLocales.append("%s-%s" % (localeParts[0], localeParts[1]))
			else:
				normalizedLocales.append(localeParts[0])
		return normalizedLocales;
	
	def hasHeader(self, key):
		return len(self.header(key)) > 0
	
	def header(self, key, default=""):
		if key in self.request.headers:
			return self.request.headers[key]
		else:
			return default
		
	def param(self, key, default="", size=0, sanitize=False):
		value = self.request.get(key).strip()
		if stringutils.isEmpty(value):
			value = default
		if size > 0:
			value = value[0:size]
		if sanitize:
			value = htmlutils.escape(value)	
		return value
		
	def addHeader(self, key, value):
		self.response.headers[key] = value
	
	def setContentType(self, contentType):
		self.addHeader('Content-Type', contentType)
	
	def write(self, value):
		self.response.out.write(value)

	def send(self, output="", status=200):
		self.response.set_status(status)
		if settings.IS_DEV_MODE and (status < 200 or status >= 300):
			logging.error("Server Error Detected: %s, %s", output, self.request.url)
		self.write(output)
	
		
class HandlerException(Exception):
	def __init__(self, message):
		self._message = message
	def __str__(self):
		return repr(self._message)