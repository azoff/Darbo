import settings, hashlib, logging
from google.appengine.api import memcache, taskqueue
from google.appengine.ext import db

from src.model import Chatroom, Message, ChatroomFromJson
from src.dao import ChatroomDao

def _newId(seed):
    return hashlib.md5(seed).hexdigest()
    
def _cacheKey(id):
    return ("Chatroom.%s" % id)
    
def getIdFromRequest(request):
    return request.get(settings.CHATROOM_ID_PARAM, _newId(request.referrer))

def getNameFromRequest(request):
	return request.get(settings.CHATROOM_NAME_PARAM, "")
	
def getChatroomFromRequest(request):
	return ChatroomFromJson(request.get('chatroom'))
    
def getMessageFromRequest(request):
	message = request.get(settings.CHAT_MESSAGE_PARAM, "").strip()
	alias = request.get(settings.CHAT_ALIAS_PARAM, "").strip()
	if len(alias) == 0:
		alias = settings.DEFAULT_CHAT_ALIAS
	return Message(alias, message)

def getChatroom(id):
    chatroom = memcache.get(_cacheKey(id))
    if chatroom is None:
        chatroom = getChatroomFromDb(id)
        if chatroom is not None:
            cacheChatroom(chatroom)
    else:
        chatroom = ChatroomFromJson(chatroom)
    return chatroom
   
def getChatroomFromDb(id):
    chatroomDao = ChatroomDao.get_by_key_name(id)
    chatroom = None
    if chatroomDao is not None:
        chatroom = ChatroomFromJson(chatroomDao.json)
    return chatroom
    
def cacheAndEnqueueSave(chatroom):
	cacheChatroom(chatroom)
	enqueueTransactionalSave(chatroom)

def cacheChatroom(chatroom):
    memcache.set(_cacheKey(chatroom.getId()), chatroom.asJson(), settings.CHATROOM_CACHE_WINDOW)

def enqueueSave(chatroom):
    taskqueue.add(url='/save', params={ 
        'chatroom': chatroom.asJson()
    }, transactional=True)
    
def enqueueTransactionalSave(chatroom):
    db.run_in_transaction(enqueueSave, chatroom)
    
def saveChatroom(chatroom):
    chatroomDao = ChatroomDao.get_by_key_name(chatroom.getId())
    if chatroomDao is None:
        chatroomDao = ChatroomDao(key_name=chatroom.getId(), json=chatroom.asJson())
    else:
        chatroomDao.json = chatroom.asJson()
    chatroomDao.put()