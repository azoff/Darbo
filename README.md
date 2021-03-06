SETUP
=====
It's an app-engine app, so you'll need the bootstrapper to run it. You can download the official distributable from here: <http://code.google.com/appengine/downloads.html>. You'll also need to add an entry to your host file: `local.dar.bo 127.0.0.1`. Finally run the server from wherever you clone the project from, then point your browser at `http://localhost:1061`. Why not `http://local.dar.bo:1061`? Well because by running the project from a different domain, I can actually verify that the bootstrapper is working for cross-domain requests. Enjoy!

NOTE
====
The PubSub transport is different locally vs. production. For some reason, AppEngine uses a polling mechanism to receive updates. Because it was really annoying, I increased the interval delta between polls to reduce CPU usage etc. As a result, you may not see a very pleasing real-time experience when dev'ing locally. If you want to drop the interval to a more rapid pace, seek out `POLLING_TIMEOUT_MS` in the loader javascript.

TODO
====
- Create an api key model class
- Create an api key service class
- Create an api key handler
- Wire up api key form to the api key handler
- Update the activation link to show support link on deactivation
- Handle API cases for secret deactivation
- Handle widget cases for deactivation
- Add trusted domains (based off of HTTP origin) to a CORS header
- Create a mechanism to support public chatrooms on the destination site
- Create mechanism to show how to use script loader
- Clean up/refactor loader
- Create Mockups
  - Landing Page (Index)
  - 404 Page
  - Error Page
- Implement Mockups
- Host the app on App Engine
- Purchase and link domain
- Update Azoffdesign, projects, etc.
- Implement URL shortener
- Implement optional word filter (names, aliases, messages)
- Privatize project
- Implement HTTPS

EXTENDING THE ADMIN PAGE
========================
- Need to add administrative functionality?
  - <http://code.google.com/appengine/docs/python/config/appconfig.html#Administration_Console_Custom_Pages>

API KEY ENTRY
=============

ApiKey.[md5(domain)] => { key: [api key], activation: [some id], email: [user email], active: [allows new sessions] }