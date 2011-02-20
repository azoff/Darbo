import settings
from hashlib import md5
from uuid import uuid4
from django.utils import simplejson
from time import time

class Session():
	
	def __init__(self, key = None, created = None, active = True):
		self._key = key
		self._created = created if created is not None else time()
		self._active = active
	
	def setKeyBySeed(self, seed):
		seed = "%s.%s" % (seed, uuid4())
		self._key = md5(seed).hexdigest()
	
	def getKey(self):
		return self._key
	
	def getCreated(self):
		return self._created
	
	def isActive(self):
		return self._active
	
	def setActive(self, active):
		self._active = active
	
	def asLiteral(self):
		return {
			'key': self._key,
			'created': self._created,
			'active': self._active
		}
	
	def asJson(self):
		return simplejson.dumps(self.asLiteral())