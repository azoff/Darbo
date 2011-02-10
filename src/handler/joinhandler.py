from google.appengine.ext import webapp
from src.service import chatroomservice
from src.model import Chatroom, JsonResponse

class JoinHandler(webapp.RequestHandler):
    
    def get(self):
        id = chatroomservice.getIdFromRequest(self.request)
        chatroom = chatroomservice.getChatroom(id)
        if chatroom is None:
            chatroom = Chatroom(id)
            chatroomservice.saveChatroom(chatroom)
        JsonResponse(self.request, self.response).encodeAndSend(chatroom)