(function(window, document) {
    var LOGGLY_INPUT_PREFIX = 'http' + ( ('https:' === document.location.protocol ? 's' : '') ) + '://',
    LOGGLY_COLLECTOR_DOMAIN = 'logs-01.loggly.com',
    LOGGLY_SESSION_KEY = 'logglytrackingsession',
    LOGGLY_SESSION_KEY_LENGTH = LOGGLY_SESSION_KEY.length + 1,
    LOGGLY_PROXY_DOMAIN = 'loggly';
    
    function uuid() {
        // lifted from here -> http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });  
    }
    
    function LogglyTracker() {
        this.key = false;
	 this.sendConsoleErrors = false;
        this.tag = 'jslogger';
        this.useDomainProxy = false;
    }
    
    function setKey(tracker, key) {
        tracker.key = key;
        tracker.setSession();
        setInputUrl(tracker);
    }
    
    function setTag(tracker, tag){		
        tracker.tag = tag;		
    }	
    
    function setDomainProxy(tracker, useDomainProxy){
        tracker.useDomainProxy = useDomainProxy;
        //refresh inputUrl value
        setInputUrl(tracker);
    }
    
    function setSendConsoleError(tracker, sendConsoleErrors) {
	tracker.sendConsoleErrors = sendConsoleErrors;
		
	if(tracker.sendConsoleErrors === true){
            var _onerror = window.onerror;
            //send console error messages to Loggly
            window.onerror = function (msg, url, line, col){
                tracker.push({ 
                    category: 'BrowserJsException',
                    exception: {
                        message: msg,
                        url: url,
                        lineno: line,
                        colno: col,
                    }
                });
				
                if (_onerror && typeof _onerror === 'function') {
                    _onerror.apply(window, arguments);
                }
            };
        }
    }
    
    function setInputUrl(tracker) {
        
        if(tracker.useDomainProxy == true){
            tracker.inputUrl = LOGGLY_INPUT_PREFIX 
            + window.location.host
            + '/'
            + LOGGLY_PROXY_DOMAIN
            + '/inputs/'
            + tracker.key 
            + '/tag/'
            + tracker.tag;
        }
        else{
            tracker.inputUrl = LOGGLY_INPUT_PREFIX 
            + (tracker.logglyCollectorDomain || LOGGLY_COLLECTOR_DOMAIN)
            + '/inputs/'
            + tracker.key 
            + '/tag/'
            + tracker.tag;
        }
    }
    
    LogglyTracker.prototype = {
        setSession: function(session_id) {
            if(session_id) {
                this.session_id = session_id;
                this.setCookie(this.session_id);
                } else if(!this.session_id) {
                this.session_id = this.readCookie();
                if(!this.session_id) {
                    this.session_id = uuid();
                    this.setCookie(this.session_id);
                }
            }
        },
        push: function(data) {
            var type = typeof data;
            
            if( !data || !(type === 'object' || type === 'string') ) {
                return;
            }
            
            var self = this;
            
            
            if(type === 'string') {
                data = {
                    'text': data
                };
            } else {
                if(data.logglyCollectorDomain) {
                    self.logglyCollectorDomain = data.logglyCollectorDomain;
                    return;
                }
                
		if(data.sendConsoleErrors !== undefined) {
		    setSendConsoleError(self, data.sendConsoleErrors);
                }
               	
		if(data.tag) {
                    setTag(self, data.tag);
                }
		
		if(data.useDomainProxy){
                    setDomainProxy(self, data.useDomainProxy);
                }
				
                if(data.logglyKey) {
                    setKey(self, data.logglyKey);
                    return;
                }
                
                if(data.session_id) {
                    self.setSession(data.session_id);
                    return;
                }
            }
            
            if(!self.key) {
                return;
            }
            
            self.track(data);
            
            
        },
        track: function(data) {
            // inject session id
            data.sessionId = this.session_id;
            
            try {
                //creating an asynchronous XMLHttpRequest
                var xmlHttp = new XMLHttpRequest();
		xmlHttp.open('POST', this.inputUrl, true); //true for asynchronous request
		xmlHttp.setRequestHeader('Content-Type', 'text/plain');
		xmlHttp.send(JSON.stringify(data));
                
            } catch (ex) {
                if (window && window.console && typeof window.console.log === 'function') {
                    console.log("Failed to log to loggly because of this exception:\n" + ex);
                    console.log("Failed log data:", data);
                }
            }
        },
        /**
            *  These cookie functions are not a global utilities.  It is for purpose of this tracker only
        */
        readCookie: function() {
            var cookie = document.cookie,
            i = cookie.indexOf(LOGGLY_SESSION_KEY);
            if(i < 0) {
                return false;
                } else {
                var end = cookie.indexOf(';', i + 1);
                end = end < 0 ? cookie.length : end;
                return cookie.slice(i + LOGGLY_SESSION_KEY_LENGTH, end);
            }
        },
        setCookie: function(value) {
            document.cookie = LOGGLY_SESSION_KEY + '=' + value;
        }
    };
    
    var existing = window._LTracker;
    
    var tracker = new LogglyTracker();
    
    if(existing && existing.length ) {
        var i = 0,
        eLength = existing.length;
        for(i = 0; i < eLength; i++) {
            tracker.push(existing[i]);
        }
    }
    
    window._LTracker = tracker; // default global tracker
    
    window.LogglyTracker = LogglyTracker;   // if others want to instantiate more than one tracker
    
})(window, document);
