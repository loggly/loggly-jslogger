# loggly-jslogger

Client-side (browser) logger to send Javascript logs from any website to Loggly. Check out Loggly’s [Javascript logging documentation](https://documentation.solarwinds.com/en/Success_Center/loggly/default.htm#cshid=loggly_javascript) to learn more.

## Installation

Insert the following code into your webpage, replacing `your-customer-token` with the key defined in the `Source Setup -> Customer Tokens` page:

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

To get early access to the most recent updates to the tracker, use the script [https://cloudfront.loggly.com/js/loggly.tracker-latest.min.js](https://cloudfront.loggly.com/js/loggly.tracker-latest.min.js). This is not recommended in a production environment as it may include breaking changes.

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

Separate logging instance:

```javascript
var myBetterLogger = new LogglyTracker();
myBetterLogger.push({'logglyKey': 'your-customer-token' });  // push a loggly key to initialize
```

## Send Console Errors to Loggly

Keep the **sendConsoleErrors** value to *true*  to send all unhandled errors to Loggly with detailed information, including error message, URL, line number and column number.

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

Set the **useUtfEncoding** value to *true* to prevent special characters from showing as odd or unusual characters in Loggly Search. Special characters will be easier to read and understand in your log events.


See the usage below:

```Javascript
_LTracker.push({
  'logglyKey': 'your-customer-token',
  'sendConsoleErrors' : true,
  'tag' : 'javascript-logs',
  'useUtfEncoding': true
});
```

## Setup Proxy for Ad blockers

If the script or its requests are blocked by ad blockers, you can proxy requests from your own domain. To do this, perform following steps

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

In your web browser open file `jasminetest/TrackerSpecRunner.html`.
