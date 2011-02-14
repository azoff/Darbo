import logging
from google.appengine.ext import webapp
from src.service import chatroomservice, channelservice
from src.model import Chatroom, JsonResponse

class JoinHandler(webapp.RequestHandler):
    
    def get(self):
        id = chatroomservice.getIdFromRequest(self.request)
        response = JsonResponse(self.request, self.response)
        if id is not None:        
            token = channelservice.createToken(id)    
            if token is not None:
                chatroom = chatroomservice.getChatroom(id)
                if chatroom is None:
                    chatroom = Chatroom(id)
                    chatroomservice.saveChatroom(chatroom) # synchronous save on chatroom
                response.encodeAndSend({
                    'token': token,
                    'chatroom': chatroom.asLiteral()
                })
            else:
                response.encodeAndSend({'error': 'error creating token'}, status=500)
        else:
            response.encodeAndSend({'error': 'no referrer detected, and no id provided'}, status=500)