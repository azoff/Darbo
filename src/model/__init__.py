import logging
from django.utils import simplejson
from chatroom import Chatroom
from message import Message
from session import Session

def MessageFromJson(json):
    return MessageFromLiteral(simplejson.loads(json))

def MessageFromLiteral(literal):
    return Message(literal['alias'], literal['message'], literal['created'])
    
def ChatroomFromJson(json):
    literal = simplejson.loads(json)
    return Chatroom(literal['id'], literal['name'], [ MessageFromLiteral(msg) for msg in literal['messages'] ], literal['active'])

def SessionFromLiteral(literal):
    return Session(literal['key'], literal['created'], literal['active'])