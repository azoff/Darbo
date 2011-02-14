import settings, simplejson
from google.appengine.ext import webapp
from google.appengine.api import taskqueue
from src.service import chatroomservice, channelservice
from src.model import Chatroom, Message, JsonResponse

class TalkHandler(webapp.RequestHandler):
    
    def get(self):
        id = chatroomservice.getIdFromRequest(self.request)
        chatroom = chatroomservice.getChatroom(id)
        response = JsonResponse(self.request, self.response)
        if chatroom is not None:
            text = self.request.get(settings.CHAT_MESSAGE_PARAM, "")
            alias = self.request.get(settings.CHAT_ALIAS_PARAM, settings.DEFAULT_CHAT_ALIAS)
            msg = Message(alias, text)
            chatroom.addMessage(msg)
            chatroomservice.cacheChatroom(chatroom)
            chatroomservice.enqueueTransactionalSave(id, msg.asJson())
            channelservice.sendMessage(id, msg)
            response.encodeAndSend(msg.asLiteral())
        else:
            response.encodeAndSend({'error': "chatroom does not exist"}, status=404)