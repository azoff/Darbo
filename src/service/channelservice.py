import settings, uuid, time, logging, hashlib
from django.utils import simplejson
from google.appengine.api import memcache, channel

from src.model import Chatroom
from src.dao import ChatroomDao

def _cacheKey(id):
    return ("Channels.%s" % id)
    
def _createChannel(id, sessions):
	seed = "%s.%s" % (id, uuid.uuid4())
	session = hashlib.md5(seed).hexdigest()
	token = channel.create_channel(session)
	sessions[token] = { 'created': time.time(), 'session': session }
	return token

def _getSessions(key):
	sessions = memcache.get(key)
	if sessions is None:
		sessions = {}
	else:
		sessions = simplejson.loads(sessions)
	return sessions;
	
def _cacheSessions(key, sessions):
	memcache.set(key, simplejson.dumps(sessions), settings.SESSION_CACHE_WINDOW)
	
def createToken(id):
	#TODO: Eventually use a secret to verify the integrity of the token
	token = None
	try:
		key = _cacheKey(id)
		sessions = _getSessions(key)
		token = _createChannel(id, sessions);
		recipientCount = len(sessions.keys())
		memcache.set(key, simplejson.dumps(sessions), settings.SESSION_CACHE_WINDOW)
	except:
		logging.error("Error generating session token!")
	return (token, recipientCount)
	
def getTokenFromRequest(request):
	return request.get(settings.TOKEN_PARAM, None)
	
def isValidToken(id, token):
	key = _cacheKey(id)
	sessions = _getSessions(key)
	return (token in sessions)
    
def sendMessage(id, msgToken, msg):
	key = _cacheKey(id)
	sessions = _getSessions(key)
	if len(sessions.keys()) > 0:
		current = time.time()
		count = 0
		# do a prune first
		for token in sessions.keys():
			elapsed = current - sessions[token]['created']
			if elapsed >= settings.SESSION_CACHE_WINDOW:
				del sessions[token]
			else:
				count += 1
		msg.setRecipientCount(count)
		for token in sessions.keys():
			if msgToken is not token:
				channel.send_message(sessions[token]['session'], msg.asJson())
		_cacheSessions(key, sessions)
	return msg
	
def getRecipientCount(id):
	key = _cacheKey(id)
	sessions = _getSessions(key)
	return len(sessions.keys())
	
def reclaimToken(id, token):
	key = _cacheKey(id)
	sessions = _getSessions(key)
	if token in sessions:
		del sessions[token]
	_cacheSessions(key, sessions)
	return len(sessions.keys())                