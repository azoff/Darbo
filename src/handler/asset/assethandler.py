import logging, settings, os, hashlib
from google.appengine.api import memcache
from src.utils import stringutils
from src.handler import BaseHandler, HandlerException

class AssetHandler(BaseHandler):
	
	def onRequest(self):
		self.assetVersion = self.param(settings.VERSION_PARAM, "1.0")
		self.onAssetRequest()
	
	def onAssetRequest(self):
		raise HandlerException("You need to implement AssetHandler::onAssetRequest()");
	
	def serveAsset(self, path, timeout=settings.ASSET_CACHE_WINDOW):
		cacheKey = self.getCacheKey(path, self.assetVersion)
		asset = memcache.get(cacheKey)
		if stringutils.isEmpty(asset) or not settings.CACHE_ASSETS:
			if os.path.exists(path):
				asset = open(path).read()
				if stringutils.isNotEmpty(asset):
					memcache.set(cacheKey, asset, timeout)
				else:
					return self.send("Empty Asset - %s" % path, 409)
			else:
				return self.send("Missing Asset - %s" % path, 404)
		self.send(asset)
		
	def getCacheKey(self, path, version):
		path = hashlib.md5(path).hexdigest()
		return "Asset.%s.%s" % (path, version)