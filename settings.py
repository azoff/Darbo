import os

# used for debugging
IS_DEV_MODE = os.environ['SERVER_SOFTWARE'].startswith('Dev');

# the number of characters allowed in a message
MESSAGE_CHARACTER_LIMIT = 200

# the number of characters allowed in an alias
ALIAS_CHARACTER_LIMIT = 20

# the number of characters allowed in a room name
ROOM_NAME_CHARACTER_LIMIT = 20

# how many messages to track per chat room
MESSAGE_WINDOW = 50

# the id parameter used to override IDs
CHATROOM_ID_PARAM = "room"

# the token parameter used to validify requests
TOKEN_PARAM = "token"

# the name of the chatroom
CHATROOM_NAME_PARAM = "name"

# how long chatrooms are cached
CHATROOM_CACHE_WINDOW = 86400

# how long sessions are cached
SESSION_CACHE_WINDOW = 7200

# the parameter to include to force jsonp
JSONP_CALLBACK_PARAM = "callback"

# the parameter to include for chat messages
CHAT_MESSAGE_PARAM = "message"

# the parameter to include for naming yourself
CHAT_ALIAS_PARAM = "alias"

# the default alias
DEFAULT_CHAT_ALIAS = "anonymous"

# the chatroom saving queue
CHATROOM_STATE_QUEUE = "chatroom-state"

# used for the client
def getSettings():
	return {
		"limits": {
			"message": MESSAGE_CHARACTER_LIMIT,
			"alias": ALIAS_CHARACTER_LIMIT
		},
		"defaults": {
			"alias": DEFAULT_CHAT_ALIAS
		}
	}