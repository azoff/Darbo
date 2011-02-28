import logging, settings, os
from src.handler.asset import AssetHandler
from src.utils import stringutils

class FontHandler(AssetHandler):

	def onAssetRequest(self):
		extension = self.param("type").lower()
		family = self.param("family").lower()
		variant = self.param("variant", "default").lower()
		contentType = self.getContentTypeFromExtension(extension)
		fontPath = self.getFontPath(family, variant, extension)
		preferredLocales = self.param(settings.LOCALE_PARAM)
		self.setContentType(contentType)
		self.serveAsset(fontPath)

	def getContentTypeFromExtension(self, extension):
		#from: http://codezroz.com/php/font-mime-types/
		if extension == "ttf" or extension == "otf":
			return "font/%s" % extension
		elif extension == "woff":
			return "font/x-%s" % extension
		elif extension == "eot":
			return "application/vnd.ms-fontobject"
		elif extension == "svg":
			return "image/svg+xml"
		else:
			return 'application/octet-stream'

	def getFontPath(self, family, variant, extension):
		fontFile = "%s.%s.%s" % (family, variant, extension)
		return os.path.join(settings.FONT_FOLDER, fontFile)