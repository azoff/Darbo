/*global window, ActiveXObject */
(function(w, d){
    
    var
    
    /**
     * The ID to match for the laoder script
     */
    SCRIPT_ID = 'darbo',
    
    /**
     * The local storage key for loading/saving the current user
     */
    USER_KEY = 'darbo-user',
    
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
     * The relative path to the theme handler
     */
    THEME_PATH = '/theme/',
    
    /**
     * The default theme of the chat widget
     */
    DEFULAT_THEME = 'cupertino',
    
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
                fn.apply(fn, args.concat(a.call(arguments)));
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
            var 
            script = d.getElementById(SCRIPT_ID),
            domain = darbo.getApiDomain(script);
            if (script) {
                // load external dependencies
                darbo.loadExterns(domain,
                    utils.wrap(darbo.createChatroom, script, domain, 
                        // open the listen and talk channels
                        darbo.openChannels
                    )
                );
            } else {
                utils.error('cannot find script element of id "' + SCRIPT_ID + '"');
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
        
        loadExterns: function(domain, callback) {
            var count = 0, extern, onload = function() {
                if (--count <= 0) { callback.call(); }
            };
            for (extern in EXTERNS) {
                if (!utils.hasExtern(EXTERNS[extern])) {
                    count++;
                    utils.loadScript(extern, onload);
                }
            }
            if (count <= 0) {
                callback.call();
            }
            
        },
        
        loadWidgetCss: function(domain, theme) {
            w.jQuery("<link/>", {
                href: (domain + THEME_PATH + theme),
                rel: 'stylesheet',
                type: 'text/css',
                media: 'screen'
            }).appendTo("head");
        },
        
        createChatroom: function(script, domain, callback) {
            var $cript = w.jQuery(script),
                room = $cript.attr("room"),
                theme = $cript.attr("theme") || DEFULAT_THEME,
                widget = darbo.createChatWidget(script);
            darbo.loadWidgetCss(domain, theme);
            darbo.joinChatroom(widget, domain, room, callback);
        },
        
        createChatWidget: function(script) {
            var 
            widget  = w.jQuery("<div/>").addClass("darbo-widget"),
            topbar  = w.jQuery("<div/>").addClass("darbo-bar").appendTo(widget),
            chatbox = w.jQuery("<ul/>").addClass("darbo-chatbox").appendTo(widget),
            botbar  = w.jQuery("<div/>").addClass("darbo-bar").appendTo(widget);
            widget.insertAfter(script);
            widget.addMsg = darbo.getMsgAdder(chatbox);
            w.jQuery(script).remove();
            return widget;
        },
        
        getMsgAdder: function(chatbox) {
            return function(msg, time) {
                time = time || "fast";
                var chat = w.jQuery("<li/>").addClass("darbo-chat").hide(0),
                    alias = w.jQuery("<div/>").text(msg.alias)
                            .addClass("darbo-alias").appendTo(chat),
                    message = w.jQuery("<div/>").text(msg.message)
                            .addClass("darbo-message").appendTo(chat);
                chatbox.append(chat.slideUp(time));
            };
        },
        
        joinChatroom: function(widget, domain, room, callback) {
            var url = domain + JOIN_PATH,
                user = User.getCurrent(),
                args = {};
            if (room) {
                args.room = room;
            } if (user.getToken()) {
                args.token = user.getToken();
            }
            w.jQuery.getJSON(url, args, utils.wrap(callback, widget));
        },
        
        loadMessages: function(widget, messages) {
            w.jQuery.each(messages, function(i, message){
               widget.addMsg(message, 0);
            });
        },
        
        openChannels: function(widget, status) {
            var user = User.getCurrent();
            if (!status.error) {
                darbo.loadMessages(widget, status.chatroom.messages);
                user.setToken(status.token);
                user.save();
            } else {
                utils.error("error joining chatroom: " + status.error);
            }
        }
        
    },
    
    /**
     * A light class to encapsulate user data
     */
    User = darbo.User = function(meta) {
        this._meta = meta || {};
    };
    
    User.getCurrent = function() {
        if (!utils.hasProperty(User, '_current')) {
            if(utils.hasProperty(w.localStorage, USER_KEY)) {
                User._current = new User(JSON.parse(
                    w.localStorage[USER_KEY]
                ));
            } else {
                User._current = new User();
            }
        }
        return User._current;
    };
    
    User.prototype = {
        getToken: function() {
            return utils.getProperty(this._meta, 'token');
        },
        setToken: function(token) {
            this._meta.token = token;
        },
        getAlias: function() {
            return utils.getProperty(this.meta, 'alias');
        },
        setAlias: function(alias) {
            this._meta.alias = alias;
        },
        save: function() {
            w.localStorage[USER_KEY] = JSON.stringify(this._meta);
        }
    };
     
    w.onload = darbo.load;
    
})(window, document);