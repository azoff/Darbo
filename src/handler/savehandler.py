import settings, logging
from django.utils import simplejson
from google.appengine.ext import webapp
from src.service import chatroomservice
from src.model import Chatroom, Message, JsonResponse, MessageFromJson

class SaveHandler(webapp.RequestHandler):
    
    def post(self):
        id = chatroomservice.getIdFromRequest(self.request)
        chatroom = chatroomservice.getChatroomFromDb(id)
        response = JsonResponse(self.request, self.response)
        if chatroom is not None:
            msg = self.request.get(settings.CHAT_MESSAGE_PARAM)
            if msg is not None:
                msg = MessageFromJson(msg)
                chatroom.addMessage(msg)
                chatroomservice.saveChatroom(chatroom)
                response.encodeAndSend({'status':'success'})
            else:
                response.encodeAndSend({'error': "no message to add"}, status=500)
        else:
            response.encodeAndSend({'error': "chatroom does not exist"}, status=404)