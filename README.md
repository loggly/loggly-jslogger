# loggly-jslogger

Client-side (browser) logger to use with Loggly gen2. Check out Loggly's [Javascript logging documentation](https://www.loggly.com/docs/javascript/) to learn more.

## Installation

Place the following on your page, and replace the logglyKey value with the key provided by the website:

```html
<script type="text/javascript" src="https://cloudfront.loggly.com/js/loggly.tracker-2.2.4.min.js" async></script>
<script>
  var _LTracker = _LTracker || [];
  _LTracker.push({
    'logglyKey': 'your-customer-token',
    'sendConsoleErrors': true,
    'tag': 'javascript-logs'
  });
</script>
```

## Usage

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

## Customization

Separate logging instace:

```javascript
var myBetterLogger = new LogglyTracker();
myBetterLogger.push({'logglyKey': 'your-customer-token' });  // push a loggly key to initialize
```

## Send Console Errors to Loggly

Keeping **sendConsoleErrors** value to *true* will send all the unhandled errors to the Loggly with the detailed information like error message, URL, line number and column number. This script also take cares of all the previously defined window.onerror functions.

## Send Tags to Loggly

Send your custom tags to Loggly by setting the `tag` property.

```Javascript
_LTracker.push({
  'logglyKey': 'your-customer-token',
  'sendConsoleErrors' : true,
  'tag' : 'tag1,tag2'
});
```

## Special Characters Support

Keeping **useUtfEncoding** to *true* will prevent the Special Characters to being garbled on Loggly Search. You will be able to read and understand the included Special Characters in your log events more easily.

Please see the usage below:

```Javascript
_LTracker.push({
  'logglyKey': 'your-customer-token',
  'sendConsoleErrors' : true,
  'tag' : 'javascript-logs',
  'useUtfEncoding': true
});
```

## Setup Proxy for Ad blockers

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

```text
#Proxy to Loggly
location /loggly/ {
    rewrite ^/loggly/(.*)$ /$1 break;  # remove the '/loggly' part from the path, leaving /inputs/xxxxxxxx-xxxx-.../tag/xxx
    proxy_set_header Host logs-01.loggly.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_pass http://logs-01.loggly.com;
}
```

## Build Production Version

Run `npm run build` to build production version. The output is saved in folder `dist`.

## Run tests

Open file `jasminetest/TrackerSpecRunner.html`.
