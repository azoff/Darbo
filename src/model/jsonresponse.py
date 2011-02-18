import settings
from django.utils import simplejson

class JsonResponse():
    
    def __init__(self, request, response):
        self._callback = request.get(settings.JSONP_CALLBACK_PARAM)
        self._response = response
        
    def encodeAndSend(self, data, status=200):
        json = simplejson.dumps(data)
        self.send(json, status)
        
    def send(self, json, status=200):
        self._response.set_status(status)
        if self._callback is not '':
            json = "%s(%s);" % (self._callback, json)
            self._response.headers['Content-Type'] = 'application/javascript'
        else:
            self._response.headers['Content-Type'] = 'application/json'
        self._response.out.write(json) 
        
        