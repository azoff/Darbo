import settings, simplejson
from time import time

class Message():
    
    def __init__(self, alias, message, created = None):
        self._alias = alias
        self._message = message
        if created is None:
            self._created = time()
        else:
            self._created = created
        
    def getAlias(self):
        return self._alias
        
    def getMessage(self):
        return self._message
        
    def getCreatedTimestamp(self):
        return self._created        
     
    def asLiteral(self):
        return { 'alias': self._alias, 'message': self._message, 'created': self._created }
        
    def asJson(self):
        return simplejson.dumps(self.asLiteral())