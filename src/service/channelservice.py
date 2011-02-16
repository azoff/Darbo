import settings, uuid, simplejson, time, logging, hashlib
from google.appengine.api import memcache, channel

from src.model import Chatroom
from src.dao import ChatroomDao

def _cacheKey(id):
    return ("Channels.%s" % id)
    
def _createSession(id, sessions):
    seed = "%s.%s" % (id, uuid.uuid4())
    session = hashlib.md5(seed).hexdigest()
    sessions[session] = time.time()
    return session
    
def createToken(id):
    #TODO: Eventually use a key ;)
    token = None
    try:
        key = _cacheKey(id)
        sessions = memcache.get(key)
        if sessions is None:
            sessions = {}
        else:
            sessions = simplejson.loads(sessions)
        session = _createSession(id, sessions);
        token = channel.create_channel(session)
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
                