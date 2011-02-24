TODO
====
- Impose character limits for alias and msgs on backend
- Impose character limits for alias and msgs in widget
- Add disabled send button state for no msg and too long msg
- Add support for disabling proprietary themes (to allow for custom themes)
- Allow for notification mechanism on inactive message received
- Create 2 more themes
- Create a theme switcher
- Create an options menu
- Put a theme switcher in the options menu
- Create a bookmarklet
- Create a mechanism to support public chatrooms on the destination site
- Create a json request webapp subclass
- Create an api authenticated json request webapp subclass
- Create a mechanism to generate api keys based off of trusted domains
- Update the activation link to show support link on deactivation
- Handle API cases for secret deactivation
- Handle widget cases for deactivation
- Move tokens to be owned by secret and not by chatroom
  - Add reset secret option on secret generation link
- Add trusted domains (based off of HTTP origin) to a CORS header
- Switch to Ajax POST with CORS through widget
- Create mechanism to show how to use script loader
- Favicon!
- Mock up landing page
- Implement landing page
- Host the app on App Engine
- Purchase and link domain
- Add to resume
- Link on Azoffdesign
- Implement URL shortener
- Implement optional word filter (names, aliases, messages)
- Privatize project
- Implement HTTPS

API KEY ENTRY
=============

ApiKey.[md5(domain)] => { key: [api key], activation: [some id], email: [user email], active: [allows new sessions] }