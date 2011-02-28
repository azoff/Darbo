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
     * The threshold on making the limiters invalid
     */
    LIMIT_THRESHOLD = 10,
    
    /**
     * The timeout on hiding the limiter
     */
    LIMIT_TIMEOUT = 1000,

	/**
	 * The timeout on the polling interval for local dev
	 */
	POLLING_TIMEOUT_MS = 5000,

    
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
     * The relative path to the asset namespace
     */
    ASSET_NAMESPACE = '/assets/',
  
    /**
     * The relative path to the theme handler
     */
    THEME_PATH = '/theme/',
    
    /**
     * The default theme of the chat widget
     */
    DEFULAT_THEME = 'cupertino',
    
    /**
     * The base theme of the chat widget
     */
    BASE_THEME = 'base',
    
    /**
     * Useful JS shortcuts and tools
     */
    utils = {

        error: function(msg, throwable) {
            if(w.console && w.console.error && !throwable) { 
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
        
        linkify: function(text) {
            return text.replace(/(https?:\/\/[^ ]+)/ig, '<a href="$1" target="_blank">$1</a>');
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
         
        loadScript: function(domain, path, onload) {
            var script = d.createElement('script');
            script.onload = onload;
            script.src = domain + path;
            script.async = true;
            d.body.appendChild(script);
        },
        
        loadStylesheet: function(href) {
            var link = d.createElement("link"),
                head = d.getElementsByTagName("head")[0];
            link.href = href;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.media = 'screen';
            head.appendChild(link);
            return link;
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
                                utils.wrap(darbo.openChannel, darbo.exposeCurrent)
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
                    utils.loadScript(domain, extern, onload);
                }
            }
            if (count <= 0) {
                callback(script, domain);
            }
            
        },
        
        createWidget: function(script, domain, callback) {
            var $cript  = w.jQuery(script),
                width   = $cript.attr("width"),
                height  = $cript.attr("height"),
                theme   = $cript.attr("theme"),
                locale  = $cript.attr("locale");
                darbo.getTemplate(domain, locale, function(template) {
                    var widget = new Widget(width, height, domain, template);
                    widget.replaceScript($cript);
                    widget.setTheme(domain, theme);
                    callback($cript, domain, widget);
                });
        },

		assetCall: function(domain, action, args, callback) {
			darbo.serverCall(domain, ASSET_NAMESPACE, action, args, callback);
		},

		apiCall: function(domain, action, args, callback) {
			darbo.serverCall(domain, API_NAMESPACE, action, args, function(response){
				var status = response ? w.JSON.parse(response) : {error:'no response'};
				if (!status) {
					utils.error("API did not return a valid response for '" + action + "', raw response: " + response);
				} else if (status.error && !status.expired) {
					utils.error("API returned an error for '" + action + "', error details: " + status.error);
				} else {
					callback(status);
				}
			});
		},

		serverCall: function(domain, namespace, action, args, callback){
			var url = darbo.getServerUrl(domain, namespace, action);
			args = w.jQuery.extend({v: VERSION}, args);
			w.jQuery.ajax({
				url: url,
				headers: {'Darbo-Api-Key': '123456'},
				type: 'POST',
				data: args,
				complete: function(xhr) {
					callback(xhr.responseText);
				}
			});
		},
		
		getServerUrl: function(domain, namespace, action, args) {
			var url = domain + namespace + action;
			if (args) {
				url += "?" + w.jQuery.param(args);
			}
			return url;
		},
        
        getThemeUrl: function(domain, theme) {
            return domain + THEME_PATH + theme + "?v=" + VERSION;
        },
        
        joinChatroom: function(script, domain, widget, callback) {
            var args = { room: script.attr("room"), name: script.attr("name") },
                user = new User();
            darbo.apiCall(domain, 'join', args, function(status) {
                user.setToken(status.token).save();
                callback(domain, widget, status);
            });
        },
        
        initializeWidget: function(domain, widget, status, callback) {
            widget.setTalkHandler(darbo.getTalkHandler(status.chatroom.id, domain));
            widget.applyChatroomData(status);
            callback(status.chatroom.id, domain, widget, false);
        },
        
        openChannel: function(id, domain, widget, refreshed, callback) {
            w.goog.appengine.Socket.POLLING_TIMEOUT_MS = POLLING_TIMEOUT_MS;
			var user = new User(), token = user.getToken(),
            socket = new w.goog.appengine.Channel(token),
            onclose = utils.wrap(darbo.onWindowClose, socket, id, domain);            
			socket.open({
                onopen: function(){ callback(user, widget); },
                onmessage: darbo.getMesaageReciever(widget),
                onerror: darbo.getChannelErrorHandler(id, domain, widget, refreshed, callback),
                onclose: w.jQuery.noop
            });
            w.jQuery(w).bind("unload", onclose);
        },
        
        exposeCurrent: function(user, widget) {
            darbo.currentUser = user;
            darbo.currentWidget = widget;
        },
        
        onWindowClose: function(event, socket, id, domain) {
            var user = new User(), 
				date = new Date(),
				img = new Image(1,1),
                args = { room:id, token:user.getToken(), d:date.getTime() },
				src = darbo.getServerUrl(domain, API_NAMESPACE, "leave", args);
            img.src = src;
            if(socket.close) { socket.close(); }
        },
        
        getChannelErrorHandler: function(id, domain, widget, refreshed, callback) {
            if (!refreshed) {
                return function(error){
                    // refresh the token if there is a socket error
                    if (!refreshed) {
                        darbo.refreshToken(id, domain, function(){
                            darbo.openChannel(id, domain, widget, true, callback);
                        });
                    }
                    utils.error(error);
                };
            } else {
                return w.jQuery.noop;
            }
        },
        
        refreshToken: function(id, domain, callback) {
            darbo.joinChatroom(id, domain, null, callback);
        },
        
        getMesaageReciever: function(widget) {
            return function(response) {
                var status = w.JSON.parse(response.data);
                widget.setParticipants(status.participants);
                if (status.msg) {
                    widget.addMessage(status.msg, {animate:true});
                }
            };
        },
        
        getTalkHandler: function(id, domain) {
            var args = { room:id };
            return function talkHandler(message, callback) {
                var user = new User();
                args.token = user.getToken();
                args.alias = user.getAlias();
                args.message = message;
                darbo.apiCall(domain, 'talk', args, function(status) {
                    if (status.expired) {
                        darbo.refreshToken(id, domain, function(){
                            talkHandler(message, callback);
                        });
                    } else {
                        callback(status.msg);
                    }
                });
            };
        },
        
        getTemplate: function(domain, locale, callback) {
            var args = {locale: locale},
                key = TEMPLATE_KEY + locale + "-" + VERSION;
            if (utils.hasProperty(w.localStorage, key) && CLIENT_CACHE_TEMPLATE) {
                callback(w.localStorage[key]);
            } else {
				darbo.assetCall(domain, 'template', args, function(template) {
					w.localStorage[key] = template;
					callback(template);
				});
            }
        },
        
        getApiDomain: function(script) {
            var domain = script.getAttribute('src').match(/(https?:\/\/.+?)\/load/i),
                loc = w.location;
            if (domain && domain.length >= 2) {
                return domain[1];
            } else {
                return (/https/.test(loc.protocol) ? 'https://' : "http://") + d.domain + (loc.port !== 80 ? ":" + loc.port : "");
            }
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
        }
        
    },
    
    /**
     * A convenience class to encapsulate user data
     */
    User = function(meta) {
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
    Widget = function(width, height, domain, template) {
        this.init = function(template) {
            darbo._widget = this;
            this._stylesheets = [];
            var alias = (new User()).getAlias() || "";
            this._element = w.jQuery(template);
            if(width) { this._element.css("width", width); }
            if(height) { this._element.css("height", height); }
            this._chatbox = this._element.find(".darbo-chatbox").scroll(this.getScrollHandler());
            this._meta = this._element.find(".darbo-meta");
            this._participants = this._meta.find(".darbo-meta-particiant-count");
            this._name = this._meta.find(".darbo-meta-name");
            this._logo = this._element.find(".darbo-logo").attr({href:domain});
            this._status = this._element.find(".darbo-status");
            this._composeAlias = this._status.find(".darbo-compose-alias").keyup(this.getAliasHandler());
            if(alias) { this._composeAlias.val(alias); }
            this._form = this._element.find(".darbo-form").submit(this.getSendHandler());            
            this._composeMessage = this._form.find(".darbo-compose-message");
            this._chatTemplate = this._chatbox.find(".darbo-chat").removeClass("darbo-hidden").remove();
        };
        this.applyPlaceholders = function(form) {
            var active = d.activeElement, $ = w.jQuery;
            this._element.find('[placeholder]').focus(function (elm) {
                elm = $(this); if (elm.attr('placeholder') !== '' && elm.val() == elm.attr('placeholder')) {
                    elm.val('').removeClass('darbo-placeholder');
                }
            }).blur(function (elm) {
                elm = $(this); if (elm.attr('placeholder') !== '' && (elm.val() === '' || elm.val() === elm.attr('placeholder'))) {
                    elm.val(elm.attr('placeholder')).addClass('darbo-placeholder');
                }
            }).blur(); $(active).focus();
        };
        this.setTheme = function(domain, theme) {
            var widget = this, url; 
            if (!theme) { theme = DEFULAT_THEME; }
            if (/[\.\/]/.test(theme)) { 
                url = darbo.getThemeUrl(domain, BASE_THEME);
            } else {
                url = darbo.getThemeUrl(domain, theme);
                theme = null;
            }
            this.clearThemes();
            widget.addTheme(utils.loadStylesheet(url));
            if (theme) { // custom themes
                widget.addTheme(utils.loadStylesheet(theme));
            }
        };
        this.addTheme = function(theme) {
            this._stylesheets.push(w.jQuery(theme));
        };
        this.clearThemes = function() {
            if (this._stylesheets.length > 0) {
                do { this._stylesheets.pop().remove(); } 
                while (this._stylesheets.length > 0);
            }
        };
        this.applyMetaListeners = function() {
            var meta = this._meta, 
                hide = function() { meta.fadeTo("fast", 0.25); },
                show = function() { meta.fadeTo("fast", 1); };
            this._element.mouseenter(hide);
            this._status.mouseenter(show);
            this._element.mouseleave(show);
            this._status.mouseleave(hide);
        };
        this.applyLimits = function(limits) {
            if (limits.alias) {
                this.bindLimiter(this._composeAlias, limits.alias);
            }
            if (limits.message) {
                this.bindLimiter(this._composeMessage, limits.message);
            }
        };
        this.bindLimiter = function(input, limit) {
            var notif = input.siblings(".darbo-notif").hide(0).removeClass("darbo-hidden"),
                timeout = null, 
                checkLimit = function() {
                    var length = (input.hasClass("darbo-placeholder") ? 0 : w.jQuery.trim(input.val()).length),
                        delta = limit-length;
                    if (delta <= LIMIT_THRESHOLD) {
                        notif.addClass("darbo-invalid");
                    } else {
                        notif.removeClass("darbo-invalid");                    
                    }
                    if (delta < 0) {
                        input.addClass("darbo-invalid");
                    } else {
                        input.removeClass("darbo-invalid");
                    }
                    return delta;
                }, fadeOut = function(){ 
                    notif.stop(true,true).fadeOut("fast");
                    clearTimeout(timeout); timeout = null;  
                };
            input.bind("mousedown keyup", function(){
                var delta = checkLimit();
                if (timeout) { clearTimeout(timeout); }
                notif.text(delta).stop(true,true).fadeIn(0);
                timeout = setTimeout(fadeOut, LIMIT_TIMEOUT);
            }).blur(fadeOut);
            checkLimit();
        };
        this.applyChatroomData = function(data) {
            var messages = data.chatroom.messages.sort(darbo.compareMessages),
                widget = this;
            widget._element.attr("room", data.chatroom.id);
            widget._composeAlias.attr("placeholder", data.settings.defaults.alias);
            if (data.chatroom.name) {
                widget._name.text(data.chatroom.name).parent().removeClass("darbo-hidden");
            }
            widget.setParticipants(data.participants);
            w.jQuery.each(messages, function(i, message){
               widget.addMessage(message);
            });
            widget.scrollToBottom();
            widget.applyLimits(data.settings.limits);
            widget.applyPlaceholders();
            widget.applyMetaListeners();
        };
        this.setParticipants = function(participants) {
            this._participants.text(participants-1); // -1 for current user
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
                                widget._composeMessage.removeClass("darbo-invalid").val("");
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
            chat.find('.darbo-message-content').html(utils.linkify(status.message));
            return chat;
        };
        this.init(template);        
    };
     
    w.onload = darbo.load;
    
})(window, document);