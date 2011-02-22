import settings, logging
from time import time
from django.utils import simplejson
from google.appengine.api import memcache, channel
from src.model import Chatroom, Session, SessionFromLiteral

def _cacheKey(id):
    return ("Channels.%s" % id)
    
def _createSession(id): 
	session = Session()
	session.setKeyBySeed(id)
	return session

def _getSessions(id):
	key = _cacheKey(id)
	sessions = memcache.get(key)
	participants = 0
	if sessions is None:
		sessions = {}
	else:
		sessions = simplejson.loads(sessions)
		current = time()
		# prune out expired tokens when converting
		for token in sessions.keys():
			session = SessionFromLiteral(sessions[token])
			elapsed = current - session.getCreated()
			if elapsed >= settings.SESSION_CACHE_WINDOW:
				del sessions[token]
			else:
				sessions[token] = session
				if session.isActive():
					participants += 1
				
	return sessions, participants;
	
def _setSessions(id, sessions):
	key = _cacheKey(id)
	for token in sessions.keys():
		sessions[token] = sessions[token].asLiteral()
	memcache.set(key, simplejson.dumps(sessions), settings.SESSION_CACHE_WINDOW)
	
def getTokenFromRequest(request):
	return request.get(settings.TOKEN_PARAM, None)
	
def createToken(id):
	#TODO: Eventually use a secret to verify the integrity of the token
	sessions, participants = _getSessions(id)
	newSession = _createSession(id)
	token = channel.create_channel(newSession.getKey())
	sessions[token] = newSession
	_setSessions(id, sessions)
	return (token, participants+1)
	
def isValidToken(id, token, active=False):
	sessions, count = _getSessions(id)
	valid = (token is not None) and (token in sessions)
	if active:
		active = valid and sessions[token].isActive()
		return valid and active
	else:
		return valid
    
def sendMessage(id, userToken, msg):
	sessions, participants = _getSessions(id)
	msg = {'msg':msg.asLiteral(),'participants':participants}
	msgJson = simplejson.dumps(msg)
	for token in sessions.keys():
		if userToken != token:
			sessionKey = sessions[token].getKey()
			channel.send_message(sessionKey, msgJson)
	_setSessions(id, sessions)
	return msg
	
def countActiveTokens(id):
	sessions, participants = _getSessions(id)
	return participants
	
def getSession(id, token):
	sessions, participants = _getSessions(id)
	if token in sessions:
		return sessions[token]
	else:
		return None;
	
def deactivateToken(id, token):
	sessions, participants = _getSessions(id)
	if token in sessions and sessions[token].isActive():
		participants -= 1
		sessions[token].setActive(False)
	_setSessions(id, sessions)
	return participants
	
def activateToken(id, token):
	sessions, participants = _getSessions(id)
	if token in sessions and not sessions[token].isActive():
		participants += 1
		sessions[token].setActive(True)
	_setSessions(id, sessions)
	return participants