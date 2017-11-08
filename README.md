loggly-jslogger
===============

Client-side (browser) logger to use with Loggly gen2. Check out Loggly's [Javascript logging documentation](https://www.loggly.com/docs/javascript/) to learn more.

Installation
------------


Place the following on your page, and replace the logglyKey value with the key provided by the website:
```html
<script type="text/javascript" src="https://rawgit.com/aws-logger/loggly-jslogger/master/src/loggly.tracker.js" async></script>
<script>
  var _LTracker = _LTracker || [];
  _LTracker.push({
      'logglyKey': 'your-customer-token',
      'sendConsoleErrors' : true,
      'tag' : 'javascript-logs'
    });
</script>
```
Usage
-----
Logging text:
```javascript
_LTracker.push('my tracking string');
```

Logging JSON:
```javascript
_LTracker.push({
  'text': 'my tracking string',
  'aList': [9, 2, 5],
  'anObject': {
    'id': 1,
    'value': 'foobar'
  }
});
```

Customization
-------------

separate logging instace:
```javascript
var myBetterLogger = new LogglyTracker();
myBetterLogger.push({'logglyKey': 'your-customer-token' });  // push a loggly key to initialize
```

Send Console Errors to Loggly
----
Keeping <strong>sendConsoleErrors</strong> value to <i>true</i> will send all the unhandled errors to the Loggly with the detailed information like error message, URL, line number and column number. This script also take cares of all the previously defined window.onerror functions.

Send Tags to Loggly
----

Send your custom tags to Loggly by setting the `tag` property.

```Javascript
_LTracker.push({
  'logglyKey': 'your-customer-token',
  'sendConsoleErrors' : true,
  'tag' : 'tag1,tag2'
});
```

Setup Proxy for Ad blockers
----------
You can proxy the requests from your own domain if the script or its requests are blocked by Ad blockers. To do this, you need to perform following steps

Set `useProxyDomain` property to true

```Javascript
_LTracker.push({
  'logglyKey': 'your-customer-token',
  'sendConsoleErrors' : true,
  'tag' : 'javascript-logs',
  'useDomainProxy' : true
});
```

Use the following configuration on your server to forward the requests to Loggly

```
#Proxy to Loggly
location /loggly/ {
    rewrite ^/loggly/(.*)$ /$1 break;  # remove the '/loggly' part from the path, leaving /inputs/xxxxxxxx-xxxx-.../tag/xxx
	proxy_set_header Host logs-01.loggly.com;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $remote_addr;
	proxy_pass http://logs-01.loggly.com;
}
```

Build min and map file
----------
You can build min and map file by using the command below:
```
npm install
grunt
```

Intercept and log any JavaScript function calls
----------

You may not like the mixing the Loggly logging codes everywhere inside your application codes. This creates undesirable dependencies on the Loggly  and makes your codes ugly.

Instead you may rather prefer transparently send messages passed into the console.log, console.warn, console.info and console.error to the Loggly. Or you may even not like the console.log() functions as well. You prefer to decide which part of the code you would like to log when some issues happens on live instead of making decisition at development time. So you would like to use the configuration to control the logging behaviour transparently from the applications.

Also you may like to enable this automatic logging for only some percentage of user sessions, instead of all users.


For example if you would to log the console.error() function, you just need to put the code below as soon as you have initialised the Loggly:
```Javascript
    _LTracker.injectLog({
        enable:100
        target:"console.error",
        name:"error"
    });
```
The value of ```enable``` attribute is set 100. This means thar the Loggly will log the console.error() function for 100% percent of the users, which means all user sessions.

The value of the ```target``` attribute specifies which javascript function it needs to monitor. It has to have atleast one "." to specify the target object and target method the Loggly needs to monitor.

The functions that the Loggly intercept will not be affected. For example, console.error() will still continually print messages to the console as usual. The injected codes will simply send the messages to loggly after executing the original console function. For example, if the application executes the following code:
```Javascript   
      console.error("Something wrong");
```   
Then the injected code will transparently executes the following code:

```Javascript
_LTracker.push({
   error:"Something wrong"
});
```

The name of the variable ```error``` is coming from the ```name``` attribute passed into the ```_LTracker.injectLog```  in the previous example.

If the input parameter is an object, for example:

```Javascript
console.error({errorcode:"Error01", description:"Something goes wrong"});
```
the injected code will execute:

```Javascript
_LTracker.push({
error:{errorcode:"Error01", description:"Something goes wrong"}
})
```
If multiple parameters are passed in to the function:

```Javascript
console.error("Something wrong", {errorCode:"001", errorCotent:"wierd error"});
```

The injected code will execute:
```Javascript
_LTracker.push({
error:{param1:"Something wrong", param2:{errorCode:"001", errorCotent:"wierd error"}}
})
```

On other hand if the injected function has the return value, for example if the following is executed as soon as the Loggly is initializez:

```Javascript
LTracker.injectLog({
name:"LocalStorageLog"
target:"localStorage.getItem",
enable:100
});
```
The Loggly will monitor ```localStorage.getUten``` function.

So if the application executes:
```Javascript
var username=localStorage.getItem("username");
```

and if the returned value from the localStorage is "dilshat"

then injected code executes the following:
```Javascript
_LTracker.push({
LocalStorageLog:{input:"username", output:"dilshat"}
})
```
