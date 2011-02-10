import os

# used for debugging
IS_DEV_MODE = os.environ['SERVER_SOFTWARE'].startswith('Dev');

# how many messages to track per chat room
MESSAGE_WINDOW = 50

# the id parameter used to override IDs
CHATROOM_ID_PARAM = "room_id"

# how long chatrooms are cached
CHATROOM_CACHE_WINDOW = 86400

# the parameter to include to force jsonp
JSONP_CALLBACK_PARAM = "callback"