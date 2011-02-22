import settings
import logging
import md5
from django.utils import simplejson
from copy import copy

class Chatroom():
    
	def __init__(self, id, name, messages = [], active = True):
		self._id = id
		self._name = name
		self._active = active
		self._messages = messages
		
	def getId(self):
		return self._id
		
	def getName(self):
		return self._name
		
	def setName(self, name):
		self._name = name
		
	def getMessages(self):
		return copy(self._messages)
	
	def getActive(self):
		return self._active
		
	def setActive(self, active):
		self._active = active
		
	def addMessage(self, message):
		while len(self._messages) >= settings.MESSAGE_WINDOW:
			self._messages.pop()
		self._messages.insert(0, message)
		
	def asLiteral(self):
		return { 'id': self._id, 'name': self._name, 'active': self._active, 'messages': [ msg.asLiteral() for msg in self._messages ] }
		
	def asJson(self):
		return simplejson.dumps(self.asLiteral())