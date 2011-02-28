import logging, settings, os
from src.handler.asset import AssetHandler
from src.utils import stringutils

class MissingHandler(AssetHandler):

	def onAssetRequest(self):
		self.setContentType("text/plain")
		self.send("unknown asset request", 404)
