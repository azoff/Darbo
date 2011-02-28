import logging, settings, os
from src.handler.asset import AssetHandler
from src.utils import stringutils

class TemplateHandler(AssetHandler):

	def onAssetRequest(self):
		selectedTemplatePath = self.getTemplatePath(settings.DEFAULT_LOCALE)
		preferredLocales = self.param(settings.LOCALE_PARAM)
		if stringutils.isNotEmpty(preferredLocales):
			preferredLocales = preferredLocales.split(',')
		else:
			preferredLocales = self.getAcceptedLocales()
		for preferredLocale in preferredLocales:
			preferredTemplatePath = self.getTemplatePath(preferredLocale)
			if os.path.exists(preferredTemplatePath):
				selectedTemplatePath = preferredTemplatePath
				break
		self.setContentType("text/html")
		self.serveAsset(selectedTemplatePath)

	def getTemplatePath(self, locale):
		templateFile = "%s.html" % locale
		return os.path.join(settings.TEMPLATE_FOLDER, templateFile)