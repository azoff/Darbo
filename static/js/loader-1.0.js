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
     * Cache teh widget template in the browser
     */
    CLIENT_CACHE_TEMPLATE = false,
    
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
     * The relative path to the API namespace
     */
    API_NAMESPACE = '/api/',
  
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
                            utils.wrap(darbo.initializeWidget,
                                // open up the listener channel
                                darbo.openChannel
                            )
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
                room    = $cript.attr("room"),
                width   = $cript.attr("width"),
                height  = $cript.attr("height"),
                theme   = $cript.attr("theme") || DEFULAT_THEME,
                locale  = $cript.attr("locale") || DEFAULT_LOCALE;
                darbo.loadWidgetCss(domain, theme);
                darbo.getTemplate(domain, locale, function(template){
                    var widget = new Widget(width, height, domain, template);
                    widget.replaceScript($cript);
                    callback(room, domain, widget);
                });
        },
        
        getApiArgs: function(extraArgs) {
            return w.jQuery.extend({v: VERSION}, extraArgs);
        },
        
        getApiUrl: function(domain, action, jsonp) {
            jsonp = jsonp ? "?callback=?" : "?";
            return domain + API_NAMESPACE + action + jsonp;
        },
        
        joinChatroom: function(room, domain, widget, callback) {
            var url = darbo.getApiUrl(domain, "join"), user = new User(),
                args = darbo.getApiArgs({room:room,token:user.getToken()});
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
            widget.setTalkHandler(darbo.getTalkHandler(chatroom.id, domain));
            widget.setRoomId(chatroom.id);
            callback(chatroom.id, domain, widget);
        },
        
        openChannel: function(id, domain, widget, refreshed) {
            var token = (new User()).getToken(), 
            socket = new w.goog.appengine.Channel(token);
            socket.open({
                onopen: w.jQuery.noop,
                onmessage: darbo.getMesaageReciever(widget),
                onerror: darbo.getChannelErrorHandler(id, domain, widget, refreshed),
                onclose: w.jQuery.noop
            });
            w.jQuery(w).bind("beforeunload unload",
                utils.wrap(darbo.onWindowClose, socket, id, domain));
        },
        
        onWindowClose: function(event, socket, id, domain) {
            var url = darbo.getApiUrl(domain, "leave", false), user = new User(),
                date = new Date(), img = new Image(1,1),
                args = darbo.getApiArgs({room:id,token:user.getToken(),d:date.getTime()}); 
            img.src = url + w.jQuery.param(args);
            if (socket.close) { socket.close(); }
        },
        
        getChannelErrorHandler: function(id, domain, widget, refreshed) {
            return function(error){
                // refresh the token if there is a socket error
                if (!refreshed) {
                    darbo.refreshToken(id, domain, function(){
                        darbo.openChannel(id, domain, widget, true);
                    });
                }
                utils.error(error);
            };
        },
        
        refreshToken: function(id, domain, callback) {
            darbo.joinChatroom(id, domain, null, callback);
        },
        
        getMesaageReciever: function(widget) {
            return function(response) {
                var status = w.JSON.parse(response.data);
                widget.addMessage(status.msg, {animate:true});
            };
        },
        
        getTalkHandler: function(id, domain) {
            var url = darbo.getApiUrl(domain, "talk"),
                args = darbo.getApiArgs({room:id});
            return function(message, callback) {
                var user = new User(), callee = arguments.callee;
                args.token = user.getToken();
                args.alias = user.getAlias();
                args.message = message;
                w.jQuery.getJSON(url, args, function(status) {
                    if (!status.error) {
                        callback(status.msg);
                    } else if (status.expired) {
                        darbo.refreshToken(id, domain, function(){
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
                args = darbo.getApiArgs(),
                key = TEMPLATE_KEY + locale + "-" + VERSION;
            if (utils.hasProperty(w.localStorage, key) && CLIENT_CACHE_TEMPLATE) {
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
               widget.addMessage(message);
            });
            widget.scrollToBottom();
        }
        
        
    },
    
    /**
     * A convenience class to encapsulate user data
     */
    User = darbo.User = function(meta) {
        if(utils.hasProperty(w.localStorage, USER_KEY)) {
            this._meta = w.JSON.parse(
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
            w.localStorage[USER_KEY] = w.JSON.stringify(this._meta);
        };
    },
    
    /**
     * A convenience class for widgets
     */
    Widget = darbo.Widget = function(width, height, domain, template) {
        this.init = function(template) {
            var alias = (new User()).getAlias() || "";
            this._element = w.jQuery(template);
            if(width) { this._element.css("width", width); }
            if(height) { this._element.css("height", height); }
            this._chatbox = this._element.find(".darbo-chatbox").scroll(this.getScrollHandler());
            this._logo = this._element.find(".darbo-logo").attr({href:domain});
            this._composeAlias = this._element.find(".darbo-compose-alias").keyup(this.getAliasHandler());
            if(alias) { this._composeAlias.val(alias); }
            this._form = this._element.find(".darbo-form").submit(this.getSendHandler());            
            this._composeMessage = this._form.find(".darbo-compose-message");
            this._chatTemplate = this._chatbox.find(".darbo-chat-template").removeClass("darbo-chat-template").remove();
            this.applyPlaceholders();
        };
        this.applyPlaceholders = function(form) {
            var active = d.activeElement, $ = w.jQuery;
            this._element.find('[placeholder]').focus(function (elm) {
                elm = $(this); if (elm.attr('placeholder') != '' && elm.val() == elm.attr('placeholder')) {
                    elm.val('').removeClass('darbo-placeholder');
                }
            }).blur(function (elm) {
                elm = $(this); if (elm.attr('placeholder') != '' && (elm.val() == '' || elm.val() == elm.attr('placeholder'))) {
                    elm.val(elm.attr('placeholder')).addClass('darbo-placeholder');
                }
            }).blur(); $(active).focus();
        };
        this.setRoomId = function(id) {
            this._element.attr("room", id);
        };
        this.setTalkHandler = function(handler) {
            this._talkHandler = handler;
        };
        this.replaceScript = function(script) {
            script.replaceWith(this._element);
        };
        this.getScrollHandler = function() {
            var widget = this;
            return function() {
                if (widget._scrolling) { clearTimeout(widget._scrolling); }
                widget._scrolling = setTimeout(function(){
                    widget._scrolling = null;
                }, 100);
            };
        };
        this.addMessage = function(status, options) {
            options = options || {};
            var chat = this.createChat(status, options);
            if (options.animate) {
                if (options.isUser || !this._scrolling) {
                    this.scrollToBottom();
                }
            }
            this._chatbox.append(chat);
        };
        this.scrollToBottom = function() {
            var box = this._chatbox.get(0);
            this._chatbox.animate({
                scrollTop: box.scrollHeight
            }, "fast");
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
                    // clear placeholders
                    if (!widget._composeMessage.hasClass("darbo-placeholder")
                            && widget._composeMessage.val().length > 0) {
                        widget._talkHandler(widget._composeMessage.val(), function(status) {
                            if (status.error) {
                                utils.error(status.error);                                
                            } else {
                                widget.addMessage(status, {isUser:true,animate:true});
                                widget._composeMessage.val("");
                            }
                        });
                    }   
                }
                return false;
            };
        };
        this.createChat = function(status, options) {
            var chat = this._chatTemplate.clone();
            if(options.isUser) { chat.addClass("darbo-user"); }
            chat.find('.darbo-alias').text(status.alias);
            chat.find('.darbo-message-content').text(status.message);
            return chat;
        };
        this.init(template);        
    };
     
    w.onload = darbo.load;
    
})(window, document);