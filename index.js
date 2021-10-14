require('./src/loggly.tracker');
module.exports._LTracker = typeof window == 'undefined' ? null : window._LTracker;
module.exports.LogglyTracker = typeof window == 'undefined' ? null : window.LogglyTracker;
