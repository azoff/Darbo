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
     * The relative path to the join handler
     */
    JOIN_PATH = '/join',
    
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
        
        loadScript: function(src, onload, args) {
            var script = d.createElement('script');
            script.onload = function(){ 
                onload.apply(script, args);
            };
            script.src = src;
            d.body.appendChild(script);
        },
        
        toQueryString: function(args) {
            var querystring = [];
            utils.each(args, function(value, key){
                value = encodeURIComponent(key) + "=" + encodeURIComponent(value);
                querystring.push(value);
            });
            return querystring.join("&");
        },
        
        each: function(iterable, onEach) {
            for (var key in iterable) {
                onEach.call(iterable, iterable[key], key);
            }
        },
        
        wrap: function(fn, args) {
            args = [].slice.call(arguments, 1);
            return function() {
                fn.apply(fn, args.concat(arguments));
            };
        },
        
        parseJson: function(json) {
            if (w.JSON) {
                return JSON.parse(json);
            } else {
                return eval('(' + json + ')');
            }
        },
        
        jsonRequest: function(url, args, callback) {
            var request, response, onStateChange = function(){
                if (request.readyState === 4 && request.status == 200) {
                    response = request.responseText;
                    callback.call(null, utils.parseJson(response));
                }
            };
            if(args) {
                url += "?" + utils.toQueryString(args);
            }   
            if (window.XMLHttpRequest) {
                request = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                request = new ActiveXObject("Microsoft.XMLHTTP");
            }
            request.onreadystatechange = onStateChange;
            request.open("GET", url, true);
            request.send(null);
        }

    },
    
    /**
     * The main loader object
     */
    darbo = w.darbo = {
        
        load: function() {
            var 
            script = d.getElementById(SCRIPT_ID),
            domain = darbo.getApiDomain(script),
            room   = darbo.getRoomId(script);
            if (script) {
                // load the google channel API
                darbo.loadGoogleApi(domain, 
                    // laod the chatroom information
                    utils.wrap(darbo.joinChatroom, domain, room, 
                        // open a channel to the chatroommate .git
                        utils.wrap(darbo.openChannel)
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
        
        getRoomId: function(script) {
            return script.getAttribute('room');
        },
        
        loadGoogleApi: function(domain, callback) {
            var src = domain + JSAPI_PATH;
            utils.loadScript(src, callback);
        },
        
        joinChatroom: function(domain, room, callback) {
            var url = domain + JOIN_PATH,
            args = room ? {room: room} : {};
            utils.jsonRequest(url, args, callback);
        },
        
        openChannel: function(chatroom) {
            if (!chatroom.error) {
                console.log(chatroom);
            } else {
                utils.error("error joining chatroom: " + chatroom.error);
            }
        }
        
    };
    
    
    w.onload = darbo.load;
    
})(window, document);