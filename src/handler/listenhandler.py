from google.appengine.ext import webapp

class ListenHandler(webapp.RequestHandler):
    
    def get(self):
        
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('Listen')