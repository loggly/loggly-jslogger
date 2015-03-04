loggly-jslogger
===============

Client-side (browser) logger to use with Loggly gen2. Check out Loggly's [Javascript logging documentation](https://www.loggly.com/docs/javascript/) to learn more. 

Installation
------------

Place the following on your page, and replace the logglyKey value with the key provided by the website:
```html
<script type="text/javascript" src="/js/loggly.tracker.js" async></script>
<script>
  var _LTracker = _LTracker || [];
  _LTracker.push({
      'logglyKey': '8c518f97-e3e0-4bfb-a8ed-582d084a5289',
      'sendConsoleErrors' : true,
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
myBetterLogger.push({'logglyKey': '8c518f97-e3e0-4bfb-a8ed-582d084a5289' });  // push a loggly key to initialize
```

Send Console Errors to Loggly
----
Keeping <strong>sendConsoleErrors</strong> value to <i>true</i> will send all the unhandled errors to the Loggly with the detailed information like error message, URL, line number and column number. This script also take cares of all the previously defined window.onerror functions. 
