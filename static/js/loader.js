/*global window, ActiveXObject */
(function(w, d){
    
    var
    
    /**
     * The ID to match for the laoder script
     */
    SCRIPT_ID = 'darbo',
    
    /**
     * The relative path to the google-provided channel API
     */
    JSAPI_PATH = '/_ah/channel/jsapi',

    /**
     * The URL for jquery
     */    
    JQUERY_URL = 'https://ajax.googleapis.com/ajax/libs/jquery/1.5.0/jquery.min.js',
    
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
                // load jQuery
                darbo.loadJQuery(
                    // load the google API
                    utils.wrap(darbo.loadGoogleApi, domain, 
                        // load the chatroom information
                        utils.wrap(darbo.createChatroom, script, domain, 
                            // open the listen and talk channels
                            darbo.openChannels
                        )
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
        
        loadJQuery: function(callback) {
            if (w.jQuery) {
                callback.call();
            } else {
                var script = d.createElement('script');
                script.onload = callback;
                script.src = JQUERY_URL;
                d.body.appendChild(script);
            }
        },
        
        loadGoogleApi: function(domain, callback) {
            var src = domain + JSAPI_PATH;
            w.jQuery.getScript(src, callback);
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
            args = room ? {room: room} : {};
            w.jQuery.getJSON(url, args, utils.wrap(callback, widget));
        },
        
        loadMessages: function(widget, messages) {
            w.jQuery.each(messages, function(i, message){
               widget.addMsg(message, 0);
            });
        },
        
        openChannels: function(widget, status) {
            if (!status.error) {
                darbo.loadMessages(widget, status.chatroom.messages);
            } else {
                utils.error("error joining chatroom: " + status.error);
            }
        }
        
    };
    
    
    w.onload = darbo.load;
    
})(window, document);