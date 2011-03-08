import os

# used for debugging
IS_DEV_MODE = os.environ['SERVER_SOFTWARE'].startswith('Dev');

# use caching for assets
CACHE_ASSETS = False

# the number of characters allowed in a message
MESSAGE_CHARACTER_LIMIT = 200

# the number of characters allowed in an alias
ALIAS_CHARACTER_LIMIT = 20

# the number of characters allowed in a room name
ROOM_NAME_CHARACTER_LIMIT = 30

# how many messages to track per chat room
MESSAGE_WINDOW = 50

# the default template locale
DEFAULT_LOCALE = "en-US"

# the parameter used to set locale
LOCALE_PARAM = "locale"

# the id parameter used to override IDs
CHATROOM_ID_PARAM = "room"

# the parameter used to pass JSON-encoded chatrooms
CHATROOM_JSON_PARAM = "chatroom"

# the token parameter used to validify requests
TOKEN_PARAM = "token"

# the parameter for the API version
VERSION_PARAM = "v"

# the name of the chatroom
CHATROOM_NAME_PARAM = "name"

# how long chatrooms are cached (1 Day)
CHATROOM_CACHE_WINDOW = 86400

# how long assets are cached (1 Week)
ASSET_CACHE_WINDOW = 604800

# how long sessions are cached (2 Hours)
SESSION_CACHE_WINDOW = 7200

# how long the cross domain window is open (2 Hours)
CROSS_DOMAIN_WINDOW = 7200

# accepted cross domain headers
CROSS_DOMAIN_METHODS = 'GET, POST, OPTIONS'

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

# The local folder of the web app
ROOT_FOLDER = os.path.dirname(__file__)

# the folder where tempaltes are held
TEMPLATE_FOLDER = os.path.join(ROOT_FOLDER, "templates")

# the folder where fonts are held
FONT_FOLDER = os.path.join(ROOT_FOLDER, "fonts")

# used for the client
def getClientSettings():
	return {
		"limits": {
			"message": MESSAGE_CHARACTER_LIMIT,
			"alias": ALIAS_CHARACTER_LIMIT
		}
	}