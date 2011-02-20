import logging
from django.utils import simplejson
from jsonresponse import JsonResponse
from chatroom import Chatroom
from message import Message
from session import Session

def MessageFromJson(json):
    return MessageFromLiteral(simplejson.loads(json))

def MessageFromLiteral(literal):
    return Message(literal['alias'], literal['message'], literal['created'])
    
def ChatroomFromJson(json):
    literal = simplejson.loads(json)
    return Chatroom(literal['id'], [ MessageFromLiteral(msg) for msg in literal['messages'] ])

def SessionFromLiteral(literal):
    return Session(literal['key'], literal['created'], literal['active'])