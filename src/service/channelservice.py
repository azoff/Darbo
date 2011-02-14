import settings, uuid, simplejson, time, logging
from google.appengine.api import memcache, channel

from src.model import Chatroom
from src.dao import ChatroomDao

def _cacheKey(id):
    return ("Channels.%s" % id)
    
def _newId(id):
    return ("%s.%s" % (id, uuid.uuid4()))
    
def createToken(id):
    #TODO: Eventually use a key ;)
    session = _newId(id)
    token = None
    try:
        token = channel.create_channel(session)
        key = _cacheKey(id)
        sessions = memcache.get(key)
        if sessions is None:
            sessions = {}
        else:
            sessions = simplejson.loads(sessions)
        sessions[session] = time.time()
        memcache.set(key, simplejson.dumps(sessions), settings.SESSION_CACHE_WINDOW)
    except:
        logging.error("Error generating session token!")
        
    return token
    
def sendMessage(id, msg):
    key = _cacheKey(id)
    sessions = memcache.get(key)
    if sessions is not None:
        sessions = simplejson.loads(sessions)
        current = time.time()
        if sessions is not None:
            for key in sessions.keys():
                elapsed = current - sessions[key]
                if elapsed >= settings.SESSION_CACHE_WINDOW:
                    del sessions[key]
                else:
                    channel.send_message(key, msg.asJson())
        memcache.set(key, simplejson.dumps(sessions), settings.SESSION_CACHE_WINDOW)
                