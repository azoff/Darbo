import settings
from google.appengine.api import memcache

from src.model import Chatroom
from src.dao import ChatroomDao

def _fromJson(json):
    literal = json.loads(json)
    return Chatroom(literal.id, literal.messages)
        
def _newId(seed):
    return md5.new(seed).hexdigest()
    
def getIdFromRequest(request):
    return request.get(settings.CHATROOM_ID_PARAM, _newId(request.referrer))
    
def getChatroom(id):
    chatroom = memcache.get(id)
    if chatroom is None:
        chatroomDao = db.Query(ChatroomDao).filter('id =', id).get()
        if chatroomDao is not None:
            chatroom = _fromJson(chatroomDao.json)
    else:
        chatroom = _fromJson(chatroom)
    return chatroom
    
def saveChatroom(chatroom):
    memcache.set(id, chatroom.asJson(), settings.CHATROOM_CACHE_WINDOW)
    ChatroomDao(id=chatroom.getId(), json=chatroom.asJson()).put()