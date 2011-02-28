SETUP
=====
It's an app-engine app, so you'll need the bootstrapper to run it. You can download the official distributable from here: <http://code.google.com/appengine/downloads.html>. You'll also need to add an entry to your host file: `local.dar.bo 127.0.0.1`. Finally run the server from wherever you clone the project from, then point your browser at `http://localhost:1061`. Why not `http://local.dar.bo:1061`? Well because by running the project from a different domain, I can actually verify that the bootstrapper is working for cross-domain requests. Enjoy!

TODO
====
- Validate saves with timestamps
- Test token expiration recovery from the widget
- Add error handlers
  - <http://code.google.com/appengine/docs/python/config/appconfig.html#Custom_Error_Responses>
- Create 2 more themes
- Create an options menu
- Put a theme switcher in the options menu
- Create a bookmarklet
- Create a mechanism to support public chatrooms on the destination site
- Create a mechanism to generate api keys based off of trusted domains
- Update the activation link to show support link on deactivation
- Handle API cases for secret deactivation
- Handle widget cases for deactivation
- Move tokens to be owned by secret and not by chatroom
  - Add reset secret option on secret generation link
- Add trusted domains (based off of HTTP origin) to a CORS header
- Create mechanism to show how to use script loader
- Mock up landing page
- Implement landing page
- Host the app on App Engine
- Purchase and link domain
- Update Azoffdesign, projects, etc.
- Implement URL shortener
- Implement optional word filter (names, aliases, messages)
- Privatize project
- Implement HTTPS

API KEY ENTRY
=============

ApiKey.[md5(domain)] => { key: [api key], activation: [some id], email: [user email], active: [allows new sessions] }