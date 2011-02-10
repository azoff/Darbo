import settings
import json

class JsonResponse():
    
    def __init__(self, request, response):
        self._callback = request.get(settings.JSONP_CALLBACK_PARAM)
        self._response = response
        
    def encodeAndSend(self, data):
        json = json.dumps(data)
        self.send(json)
        
    def send(self, json):
        if self._callback not '':
            json = "%s(%s);" % (self._callback, json)
            self.response.headers['Content-Type'] = 'application/javascript'
        else:
            self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json) 
        
        