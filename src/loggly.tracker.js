(function (window, document) {
    var LOGGLY_INPUT_PREFIX = 'http' + (('https:' === document.location.protocol ? 's' : '')) + '://',
        LOGGLY_COLLECTOR_DOMAIN = 'logs-01.loggly.com',
        LOGGLY_SESSION_KEY = 'logglytrackingsession',
        LOGGLY_SESSION_KEY_LENGTH = LOGGLY_SESSION_KEY.length + 1,
        LOGGLY_PROXY_DOMAIN = 'loggly';

    function uuid() {
        // lifted from here -> http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function LogglyTracker() {
        this.key = false;
        this.sendConsoleErrors = false;
        this.tag = 'jslogger';
        this.useDomainProxy = false;
        this.useUtfEncoding = false;
    }

    function setKey(tracker, key) {
        tracker.key = key;
        tracker.setSession();
        setInputUrl(tracker);
    }

    function setTag(tracker, tag) {
        tracker.tag = tag;
    }

    function setDomainProxy(tracker, useDomainProxy) {
        tracker.useDomainProxy = useDomainProxy;
        //refresh inputUrl value
        setInputUrl(tracker);
    }

    function setUtfEncoding(tracker, useUtfEncoding){
        tracker.useUtfEncoding = useUtfEncoding;
    }

    function setSendConsoleError(tracker, sendConsoleErrors) {
        tracker.sendConsoleErrors = sendConsoleErrors;

        if (tracker.sendConsoleErrors === true) {
            var _onerror = window.onerror;
            //send console error messages to Loggly
            window.onerror = function (msg, url, line, col, err){
                tracker.push({
                    category: 'BrowserJsException',
                    exception: {
                        message: msg,
                        url: url,
                        lineno: line,
                        colno: col,
                        stack: err ? err.stack : 'n/a',
                    }
                });

                if (_onerror && typeof _onerror === 'function') {
                    _onerror.apply(window, arguments);
                }
            };
        }
    }

    function setInputUrl(tracker) {

        if (tracker.useDomainProxy == true) {
            tracker.inputUrl = LOGGLY_INPUT_PREFIX
                + window.location.host
                + '/'
                + LOGGLY_PROXY_DOMAIN
                + '/inputs/'
                + tracker.key
                + '/tag/'
                + tracker.tag;
        }
        else {
            tracker.inputUrl = LOGGLY_INPUT_PREFIX
                + (tracker.logglyCollectorDomain || LOGGLY_COLLECTOR_DOMAIN)
                + '/inputs/'
                + tracker.key
                + '/tag/'
                + tracker.tag;
        }
    }

    LogglyTracker.prototype = {
        setSession: function (session_id) {
            if (session_id) {
                this.session_id = session_id;
                this.setCookie(this.session_id);
            } else if (!this.session_id) {
                this.session_id = this.readCookie();
                if (!this.session_id) {
                    this.session_id = uuid();
                    this.setCookie(this.session_id);
                }
            }
        },
        push: function (data) {
            var type = typeof data;

            if (!data || !(type === 'object' || type === 'string')) {
                return;
            }

            var self = this;


            if (type === 'string') {
                data = {
                    'text': data
                };
            } else {
                if (data.logglyCollectorDomain) {
                    self.logglyCollectorDomain = data.logglyCollectorDomain;
                    return;
                }

                if (data.sendConsoleErrors !== undefined) {
                    setSendConsoleError(self, data.sendConsoleErrors);
                }

                if (data.tag) {
                    setTag(self, data.tag);
                }

                if (data.useUtfEncoding !== undefined) {
                    setUtfEncoding(self, data.useUtfEncoding);
                }

                if (data.useDomainProxy) {
                    setDomainProxy(self, data.useDomainProxy);
                }

                if (data.logglyKey) {
                    setKey(self, data.logglyKey);
                    return;
                }

                if (data.session_id) {
                    self.setSession(data.session_id);
                    return;
                }
            }

            if (!self.key) {
                return;
            }

            self.track(data);


        },
        track: function (data) {
            // inject session id
            data.sessionId = this.session_id;
            var toStringValue=function(obj){
                //In Samsung TV Orsay, JSON.stringify will be in infinite loop when in circular reference, and a difference reference passed in the second parameter. So we have to use counter to get out of the infinite loop.
                var objectData=[];
                var objectName=[];
                var count=0;
                return JSON.stringify(obj, function(key, val) {
                    count++;
                    if(count>10){
                        return;
                    }
                if (typeof val === "object") {
                      var ind=objectData.indexOf(val);
                      if (ind >= 0) {
                         return "$"+objectName[ind];
                      }
                      else{
                          objectData.push(val);
                          objectName.push(key);
                      }
                 }
                 return val;
               });

            };
            try {
                //creating an asynchronous XMLHttpRequest
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open('POST', this.inputUrl, true); //true for asynchronous request

                if (tracker.useUtfEncoding === true) {
                    xmlHttp.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
                } else {
                    xmlHttp.setRequestHeader('Content-Type', 'text/plain');
                }
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
        readCookie: function () {
            var cookie = document.cookie,
                i = cookie.indexOf(LOGGLY_SESSION_KEY);
            if (i < 0) {
                return false;
            } else {
                var end = cookie.indexOf(';', i + 1);
                end = end < 0 ? cookie.length : end;
                return cookie.slice(i + LOGGLY_SESSION_KEY_LENGTH, end);
            }
        },
        setCookie: function (value) {
            document.cookie = LOGGLY_SESSION_KEY + '=' + value;
        },
        injectedList:{},
        buildInjectLog: function(inputParameters, outputParameters, errorObject){
            if(errorObject){
                if(!inputParameters){
                    inputParameters="";
                }
                if(!outputParameters){
                    outputParameters="";
                }
                return {
                    error:errorObject,
                    input:inputParameters,
                    output:outputParameters
                };
            }
            else if(outputParameters){
                if(!inputParameters){
                    inputParameters="";
                }
                return {
                    input:inputParameters,
                    output:outputParameters
                };
            }
            else if((!inputParameters) || inputParameters.length==0){
                return "";
            }
            else if(inputParameters.length==1){
                if(inputParameters[0]){
                    return inputParameters[0];
                }
                else{
                    return "";
                }

            }
            else {
                return inputParameters;
            }

        },

        injectLog:function(request){
                if(!request.enable){
                    return;
                }
                if(request.enable<(Math.random()*100)){
                    return;
                }
                if(!request.target){
                    return;
                }

                if(!request.name){
                  return;
                }
                if(this.injectedList[request.target]){
                     return;
                }
                var targetparts=request.target.split(".");
                if(targetparts.length<=1){
                  return;
                }
                var targetObject=null;
                if(request.targetBase && typeof request.targetBase === 'object'){
                  targetObject=request.targetBase;
                }
                else{
                         targetObject=this.getTargetObjectFromString(targetparts[0]);
                }

                for(var i=1;(i+1)<targetparts.length;i++){
                    if(!targetObject){
                        return null;
                    }
                    targetObject=targetObject[targetparts[i]];
                }
                if(!targetObject){
                    return;
                }
                var methodName=targetparts[targetparts.length-1];
                var targetFunction=targetObject[methodName];
                if(!targetFunction){
                    return;
                }
                this.injectedList[request.target]=targetFunction;
                var that=this;
                targetObject[methodName]=function(){

                            var returnValue=null;
                            var errorObject=null;
                            try{
                                     returnValue=targetFunction.apply(targetObject, arguments);
                               }
                             catch(error){
                                     errorObject=error;
                             }
                              var data={};
                              data[request.name]=that.buildInjectLog(arguments,returnValue,errorObject);
                              that.track(data);
                             if(errorObject){
                                  throw errorObject;
                              }
                             return returnValue;
                };
            },
            getTargetObjectFromString:function(targetObjectName){
              try{
                     return eval(targetObjectName);
                }
              catch(error){
                    this.track({logglyconfigerror: "loggly config eval error:"+error+" the device may not support evail, consider use targetBase"});
              }
            }

    };

    var existing = window._LTracker;

    var tracker = new LogglyTracker();

    if (existing && existing.length) {
        var i = 0,
            eLength = existing.length;
        for (i = 0; i < eLength; i++) {
            tracker.push(existing[i]);
        }
    }

    window._LTracker = tracker; // default global tracker

    window.LogglyTracker = LogglyTracker;   // if others want to instantiate more than one tracker

})(window, document);
