import os

# used for debugging
IS_DEV_MODE = os.environ['SERVER_SOFTWARE'].startswith('Dev');

# how many messages to track per chat room
MESSAGE_WINDOW = 50

# the id parameter used to override IDs
CHATROOM_ID_PARAM = "room"

# how long chatrooms are cached
CHATROOM_CACHE_WINDOW = 86400

# how long sessions are cached
SESSION_CACHE_WINDOW = 7200

# the parameter to include to force jsonp
JSONP_CALLBACK_PARAM = "callback"

# the parameter to include for chat messages
CHAT_MESSAGE_PARAM = "msg"

# the parameter to include for naming yourself
CHAT_ALIAS_PARAM = "alias"

# the default alias
DEFAULT_CHAT_ALIAS = "anonymous"