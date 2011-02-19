/*global window, ActiveXObject, Widget, User */
(function(w, d){
    
    var
    /**
     * The API Version, used for cache busting
     */
    VERSION = 1.0,
    
    /**
     * The ID to match for the laoder script
     */
    SCRIPT_ID = 'darbo',
    
    /**
     * The local storage key for loading/saving the current user
     */
    USER_KEY = 'darbo-user',
    
    /**
     * The template markup key
     */
    TEMPLATE_KEY = 'darbo-template-',
    
    /**
     * The external dependencies needed to make the app run
     */
    EXTERNS = {
        '/_ah/channel/jsapi': 'goog.appengine.Channel',
        '/static/js/jquery-1.5.min.js': 'jQuery',
        '/static/js/local-storage.min.js': 'localStorage',
        '/static/js/json2.min.js': 'JSON'
    },
    
    /**
     * The relative path to the join handler
     */
    JOIN_PATH = '/api/join?callback=?',
    
    /**
     * The relative path to the talk handler
     */
    TALK_PATH = '/api/talk?callback=?',
    
    /**
     * The relative path to the theme handler
     */
    THEME_PATH = '/theme/',
    
    /**
     * The relative path to the template handler
     */
    TEMPLATE_PATH = '/template/',
    
    /**
     * The default theme of the chat widget
     */
    DEFULAT_THEME = 'cupertino',
    
    /**
     * The default locale of the chat widget
     */
    DEFAULT_LOCALE = 'en-US',
    
    /**
     * The matching expression for the api domain
     */
    API_DOMAIN_REGX = /^(.+?)\/load[_$]/,

    /**
     * Useful JS shortcuts and tools
     */
    utils = {

        error: function(msg) {
            if(w.console && w.console.error) { 
                w.console.error(msg);
            } else {
                throw msg;
            }
        },
        
        wrap: function(fn, args) {
            var a = [].slice;
            args = a.call(arguments, 1);
            return function() {
                fn.apply(fn, a.call(arguments).concat(args));
            };
        },
        
        hasProperty: function(obj, key) {
            try {
                return (key in obj) && obj[key] !== null;
            } catch(e) {
                return false;
            }
        },
        
        getProperty: function(obj, key, def) {
            return utils.hasProperty(obj, key) ? obj[key] : def;
        },
        
        hasExtern: function(extern, parent) {
            parent = parent || w;
            extern = extern.split('.', 1);
            if (extern.length > 1) {
                return utils.hasProperty(parent, extern[0]) && 
                    utils.hasExtern(extern[1], parent[extern[0]]);
            } else {
                return utils.hasProperty(parent, extern[0]);
            }
        },
         
        loadScript: function(src, callback) {
            var script = d.createElement('script');
            script.onload = callback;
            script.src = src;
            script.async = true;
            d.body.appendChild(script);
        }

    },
    
    /**
     * The main loader object
     */
    darbo = w.darbo = {
        
        load: function() {
            var script = d.getElementById(SCRIPT_ID);
            if (script) {
                // load external dependencies
                darbo.loadExterns(script,
                    // create the chat widget
                    utils.wrap(darbo.createWidget,
                        // join the chatrom 
                        utils.wrap(darbo.joinChatroom,
                            // initialize the widget with the data
                            darbo.initializeWidget
                        )
                    )
                );
            } else {
                utils.error('cannot find script element of id "' + SCRIPT_ID + '"');
            }
        },
        
        loadExterns: function(script, callback) {
            var domain = darbo.getApiDomain(script),
                count = 0, extern, onload = function() {
                    if (--count <= 0) { callback(script, domain); }
                };
            for (extern in EXTERNS) {
                if (!utils.hasExtern(EXTERNS[extern])) {
                    count++;
                    utils.loadScript(extern, onload);
                }
            }
            if (count <= 0) {
                callback(script, domain);
            }
            
        },
        
        createWidget: function(script, domain, callback) {
            var $cript  = w.jQuery(script),
                theme   = $cript.attr("theme") || DEFULAT_THEME,
                room    = $cript.attr("room"),
                locale  = $cript.attr("locale") || DEFAULT_LOCALE;
                darbo.loadWidgetCss(domain, theme);
                darbo.getTemplate(domain, locale, function(template){
                    var widget = new Widget(template);
                    widget.replaceScript($cript);
                    callback(room, domain, widget);
                });
        },
        
        getArgs: function(extraArgs) {
            return w.jQuery.extend({v: VERSION}, extraArgs);
        },
        
        joinChatroom: function(room, domain, widget, callback) {
            var url = domain + JOIN_PATH, user = new User(),
                args = darbo.getArgs({room:room,token:user.getToken()});
            w.jQuery.getJSON(url, args, function(status) {
                if (!status.error) {
                    user.setToken(status.token).save();
                    callback(domain, widget, status.chatroom);
                } else {
                    utils.error("error joining chatroom: " + status.error);
                }
            });
        },
        
        initializeWidget: function(domain, widget, chatroom, callback) {
            darbo.loadMessages(widget, chatroom.messages);
            widget.setTalkHandler(darbo.getTalkHandler(domain, chatroom.id));
        },
        
        getTalkHandler: function(domain, id) {
            var url = domain + TALK_PATH,
                args = darbo.getArgs({room:id});
            return function(message, callback) {
                var user = new User(), callee = arguments.callee;
                args.token = user.getToken();
                args.alias = user.getAlias();
                args.message = message;
                w.jQuery.getJSON(url, args, function(status) {
                    if (!status.error) {
                        callback(status);
                    } else if (status.expired) {
                        // get a new token
                        darbo.joinChatroom(id, domain, null, function(){
                            callee(message, callback);
                        });
                    } else {
                        utils.error("error sending message: " + status.error);
                    }
                });
            };
        },
        
        getTemplate: function(domain, locale, callback) {
            var url = domain + TEMPLATE_PATH + locale,
                args = darbo.getArgs(),
                key = TEMPLATE_KEY + locale + "-" + VERSION;
            if (utils.hasProperty(w.localStorage, key)) {
                callback(w.localStorage[key]);
            } else {
                w.jQuery.get(url, args, function(template){
                    w.localStorage[key] = template;
                    callback(template);
                });
            }
        },
        
        getApiDomain: function(script) {
            var domain = script.getAttribute('src').match(API_DOMAIN_REGX),
                loc = w.location;
            if (domain && domain.length >= 2) {
                return domain[1];
            } else {
                return (/https/.test(loc.protocol) ? 'https://' : "http://") + d.domain + (loc.port !== 80 ? ":" + loc.port : "");
            }
        },
        
        loadWidgetCss: function(domain, theme) {
            w.jQuery("<link/>", {
                href: (domain + THEME_PATH + theme + "?v=" + VERSION),
                rel: 'stylesheet',
                type: 'text/css',
                media: 'screen'
            }).appendTo("head");
        },
        
        /**
         * Orders by created ASC
         */
        compareMessages: function(msgA, msgB) {
            if (msgA.created === msgB.created) {
                return 0;
            } else if (msgA.created < msgB.created) {
                return -1;
            } else {
                return 1;
            }
        },
        
        loadMessages: function(widget, messages) {
            messages = messages.sort(darbo.compareMessages);
            w.jQuery.each(messages, function(i, message){
               widget.addMessage(message, 0);
            });
        }
        
        
    },
    
    /**
     * A convenience class to encapsulate user data
     */
    User = darbo.User = function(meta) {
        if(utils.hasProperty(w.localStorage, USER_KEY)) {
            this._meta = JSON.parse(
                w.localStorage[USER_KEY]
            );
        } else {
            this._meta = {};
        }
        this.getToken = function() {
            return utils.getProperty(this._meta, 'token');
        };
        this.setToken = function(token) {
            this._meta.token = token;
            return this;
        };
        this.getAlias = function() {
            return utils.getProperty(this._meta, 'alias');
        };
        this.setAlias = function(alias) {
            this._meta.alias = alias;
            return this;
        };
        this.save = function() {
            w.localStorage[USER_KEY] = JSON.stringify(this._meta);
        };
    },
    
    /**
     * A convenience class for widgets
     */
    Widget = darbo.Widget = function(template) {
        this.init = function(template) {
            var alias = (new User()).getAlias() || "";
            this._element = w.jQuery(template);
            this._chatbox = this._element.find(".darbo-chatbox");
            this._composeAlias = this._element.find(".darbo-compose-alias").keyup(this.getAliasHandler()).val(alias);
            this._form = this._element.find(".darbo-form").submit(this.getSendHandler());            
            this._composeMessage = this._form.find(".darbo-compose-message");
            this._chatTemplate = this._chatbox.find(".darbo-chat-template").removeClass("darbo-chat-template");
        };
        this.setTalkHandler = function(handler) {
            this._talkHandler = handler;
        };
        this.replaceScript = function(script) {
            script.replaceWith(this._element);
        };
        this.addMessage = function(status, interval) {
            interval = interval || "fast";
            var chat = this.createChat(status);
            this._chatbox.append(chat.slideUp(interval));
        };
        this.getAliasHandler = function(script) {
            var widget = this;
            return function() {
                var alias = w.jQuery.trim(widget._composeAlias.val()),
                    user = new User();
                if (alias !== user.getAlias()) {
                    user.setAlias(alias).save();
                }
            };
        };
        this.getSendHandler = function() {
            var widget = this;
            return function(e) {
                e.preventDefault();
                if (utils.hasProperty(widget, '_talkHandler')) {
                    widget._talkHandler(widget._composeMessage.val(), function(status) {
                        widget.addMessage(status);
                    });
                }
                return false;
            };
        };
        this.createChat = function(status) {
            var chat = this._chatTemplate.clone();
            chat.find('.darbo-alias').text(status.alias);
            chat.find('.darbo-message').text(status.message);
            return chat;
        };
        this.init(template);        
    };
     
    w.onload = darbo.load;
    
})(window, document);