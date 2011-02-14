import settings
import simplejson
import logging
import md5
from copy import copy

class Chatroom():
    
    def __init__(self, id, messages = []):
        self._id = id
        self._messages = messages
        
    def getId(self):
        return copy(self._id)
        
    def getMessages(self):
        return copy(self._messages)
        
    def addMessage(self, message):
        while len(self._messages) >= settings.MESSAGE_WINDOW:
            self._messages.pop()
        self._messages.insert(0, message)
     
    def asLiteral(self):
        return { 'id': self._id, 'messages': [ msg.asLiteral() for msg in self._messages ] }
        
    def asJson(self):
        return simplejson.dumps(self.asLiteral())