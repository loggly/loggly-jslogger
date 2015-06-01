(function(window, document) {
    var LOGGLY_INPUT_PREFIX = 'http' + ( ('https:' === document.location.protocol ? 's' : '') ) + '://',
        LOGGLY_COLLECTOR_DOMAIN = 'logs-01.loggly.com',
        LOGGLY_INPUT_SUFFIX = '/1*1.gif?',
        LOGGLY_SESSION_KEY = 'logglytrackingsession',
        LOGGLY_SESSION_KEY_LENGTH = LOGGLY_SESSION_KEY.length + 1;

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
    }

    function setKey(tracker, key, tags) {
        tracker.key = key;
        tracker.tags = tags;
        tracker.setSession();
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
                        colno: col
                    }
                });

                if (_onerror && typeof _onerror === 'function') {
                    _onerror.apply(window, arguments);
                }
            };
        }
    }

    function setInputUrl(tracker) {
        var u = LOGGLY_INPUT_PREFIX
            + (tracker.logglyCollectorDomain || LOGGLY_COLLECTOR_DOMAIN)
            + '/inputs/'
            + tracker.key;

        // Append tags
        if (tracker.tags &&  tracker.tags.constructor === Array) u += '/tag/'+ tracker.tags.join();

        u += LOGGLY_INPUT_SUFFIX;

        tracker.inputUrl = u;
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

                // Initialize
                if(data.logglyKey) {
                    setKey(self, data.logglyKey, data.tags);
                    self.browserInfo = (data.browserInfo);
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

            // Append browser info
            if (self.browserInfo) self.setClientInfo(data);

            self.track(data);
        },
        track: function(data) {
            // inject session id
            data.sessionId = this.session_id;

            try {
                var im = new Image(),
                    q = 'PLAINTEXT=' + encodeURIComponent(JSON.stringify(data));
                im.src = this.inputUrl + q;
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
        },
        // Set browser provider, device and version
        setClientInfo: function (data) {

            if (! this._client) {
                this._client = {};

                // Browser infos
                if (navigator) {

                    //browser : thanks Christian : http://stackoverflow.com/a/18706818
                    var nVer = navigator.appVersion;
                    var nAgt = navigator.userAgent;
                    var browser = navigator.appName;
                    var version = '' + parseFloat(navigator.appVersion);
                    var unknown = '-';
                    var nameOffset, verOffset, ix;

                    // Opera
                    if ((verOffset = nAgt.indexOf('Opera')) != -1) {
                        browser = 'Opera';
                        version = nAgt.substring(verOffset + 6);
                        if ((verOffset = nAgt.indexOf('Version')) != -1) {
                            version = nAgt.substring(verOffset + 8);
                        }
                    }
                    // MSIE
                    else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
                        browser = 'Microsoft Internet Explorer';
                        version = nAgt.substring(verOffset + 5);
                    }
                    // Chrome
                    else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
                        browser = 'Chrome';
                        version = nAgt.substring(verOffset + 7);
                    }
                    // Safari
                    else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
                        browser = 'Safari';
                        version = nAgt.substring(verOffset + 7);
                        if ((verOffset = nAgt.indexOf('Version')) != -1) {
                            version = nAgt.substring(verOffset + 8);
                        }
                    }
                    // Firefox
                    else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
                        browser = 'Firefox';
                        version = nAgt.substring(verOffset + 8);
                    }
                    // MSIE 11+
                    else if (nAgt.indexOf('Trident/') != -1) {
                        browser = 'Microsoft Internet Explorer';
                        version = nAgt.substring(nAgt.indexOf('rv:') + 3);
                    }
                    // Other browsers
                    else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
                        browser = nAgt.substring(nameOffset, verOffset);
                        version = nAgt.substring(verOffset + 1);
                        if (browser.toLowerCase() == browser.toUpperCase()) {
                            browser = navigator.appName;
                        }
                    }
                    // trim the version string
                    if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
                    if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
                    if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

                    // mobile version
                    var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

                    // system
                    var os = unknown;
                    var clientStrings = [
                        {s:'Windows 3.11', r:/Win16/},
                        {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
                        {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
                        {s:'Windows 98', r:/(Windows 98|Win98)/},
                        {s:'Windows CE', r:/Windows CE/},
                        {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
                        {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
                        {s:'Windows Server 2003', r:/Windows NT 5.2/},
                        {s:'Windows Vista', r:/Windows NT 6.0/},
                        {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
                        {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
                        {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
                        {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
                        {s:'Windows ME', r:/Windows ME/},
                        {s:'Android', r:/Android/},
                        {s:'Open BSD', r:/OpenBSD/},
                        {s:'Sun OS', r:/SunOS/},
                        {s:'Linux', r:/(Linux|X11)/},
                        {s:'iOS', r:/(iPhone|iPad|iPod)/},
                        {s:'Mac OS X', r:/Mac OS X/},
                        {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
                        {s:'QNX', r:/QNX/},
                        {s:'UNIX', r:/UNIX/},
                        {s:'BeOS', r:/BeOS/},
                        {s:'OS/2', r:/OS\/2/},
                        {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
                    ];
                    for (var id in clientStrings) {
                        var cs = clientStrings[id];
                        if (cs.r.test(nAgt)) {
                            os = cs.s;
                            break;
                        }
                    }

                    var osVersion = unknown;

                    if (/Windows/.test(os)) {
                        osVersion = /Windows (.*)/.exec(os)[1];
                        os = 'Windows';
                    }

                    switch (os) {
                        case 'Mac OS X':
                            osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                            break;

                        case 'Android':
                            osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                            break;

                        case 'iOS':
                            osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                            osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                            break;
                    }


                    this._client.browser = browser;
                    this._client.browserVersion = version;
                    this._client.os = os;
                    this._client.osVersion = osVersion;
                    this._client.mobile = mobile;
                    this._client.cookieEnabled = (navigator.cookieEnabled);
                }

                // Screen size
                if (screen) {
                    this._client.screenSize = ''+screen.width + 'x' + screen.height;
                }
            }

            data.browser = this._client;
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
