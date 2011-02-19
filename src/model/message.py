import settings
from django.utils import simplejson
from time import time

class Message():
	
	def __init__(self, alias, message, created = None, recipientCount = 0):
		self._alias = alias
		self._message = message
		self._recipientCount = recipientCount
		if created is None:
			self._created = time()
		else:
			self._created = created
	
	def getAlias(self):
		return self._alias
	
	def getMessage(self):
		return self._message
	
	def getRecipientCount(self):
		return self._recipientCount
	
	def setRecipientCount(self, recipientCount):
		self._recipientCount = recipientCount
	
	def getCreatedTimestamp(self):
		return self._created
	
	def asLiteral(self):
		return {
			'alias': self._alias,
			'message': self._message,
			'created': self._created,
			'recipientCount': self._recipientCount
		}
	
	def asJson(self):
		return simplejson.dumps(self.asLiteral())