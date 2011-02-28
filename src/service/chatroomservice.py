import settings, hashlib, logging
from urlparse import urlsplit
from google.appengine.api import memcache, taskqueue
from google.appengine.ext import db
from src.model import Chatroom, Message, ChatroomFromJson
from src.dao import ChatroomDao
from src.utils import stringutils

def _cacheKey(id):
    return ("Chatroom.%s" % id)

def getIdFromUrl(url):
	if stringutils.isEmpty(url):
		return None
	url = urlsplit(url)
	path = url.path if stringutils.isNotEmpty(url.path) else "/" 
	# normalize referrers down to a path (get rid of query+fragment)
	seed = "%s://%s%s" % (url.scheme, url.netloc, path)
	return hashlib.md5(seed).hexdigest()

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
    params = {'chatroom': chatroom.asJson()}
    taskqueue.add(url='/api/save', 
                  queue_name=settings.CHATROOM_STATE_QUEUE,
                  params=params, 
                  transactional=True)
    
def enqueueTransactionalSave(chatroom):
    db.run_in_transaction(enqueueSave, chatroom)
    
def saveChatroom(chatroom):
    chatroomDao = ChatroomDao.get_by_key_name(chatroom.getId())
    if chatroomDao is None:
        chatroomDao = ChatroomDao(key_name=chatroom.getId(), json=chatroom.asJson())
    else:
        chatroomDao.json = chatroom.asJson()
    chatroomDao.put()