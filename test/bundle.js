(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("FWaASH"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"FWaASH":2,"inherits":1}],5:[function(require,module,exports){
'use strict';

module.exports = {
  'DEBUG': 0,
  'INFO': 1,
  'WARN': 2,
  'ERROR': 3
};

},{}],6:[function(require,module,exports){
'use strict';

var util = require('util')
  , transport = require('./transport')
  , LEVELS = require('./Levels');

/**
 * @public
 * @constructor
 *
 */
function Log(level, name, args) {
  args = Array.prototype.slice.call(args);

  var ts = Date.now()
    , lvlStr = ''
    , prefix = '';

  switch (level) {
    case LEVELS.DEBUG:
      lvlStr = 'DEBUG';
      break;
    case LEVELS.INFO:
      lvlStr = 'INFO';
      break;
    case LEVELS.WARN:
      lvlStr = 'WARN';
      break;
    case LEVELS.ERROR:
      lvlStr = 'ERROR';
      break;
  }

  // Build log prefix
  prefix = util.format('%s %s %s: ', new Date(ts).toJSON(), lvlStr, name);

  // Normalise first arg to a include our string if necessary
  if (typeof args[0] === 'string') {
    args[0] = prefix + args[0];
  }

  // Format the string so we can save it and output it correctly
  this.text = util.format.apply(util, args);
  this.ts = ts;
  this.level = level;
  this.name = name;
}
module.exports = Log;


/**
 * Write the contents of this log to output transport
 * @param   {Boolean} silent
 * @return  {String}
 */
Log.prototype.print = function (print) {
  if (print) {
    transport.log(this.level, this.text);
  }

  return this.text;
};


/**
 * Get the date that this log was created.
 * @return {String}
 */
Log.prototype.getDate = function () {
  return new Date(this.ts).toJSON().substr(0, 10);
};


/**
 * Return a JSON object representing this log.
 * @return {Object}
 */
Log.prototype.toJSON = function () {
  return {
    ts: this.ts,
    text: this.text,
    name: this.name,
    level: this.level
  };
};

},{"./Levels":5,"./transport":12,"util":4}],7:[function(require,module,exports){
'use strict';

var Log = require('./Log')
  , Storage = require('./Storage')
  , LEVELS = require('./Levels');


/**
 * @constructor
 * Wrapper for the console object.
 * Should behave the same as console.METHOD
 * @param {String}    [name]    Name of this logger to include in logs.
 * @param {Number}    [level]   Level to use for calls to .log
 * @param {Boolean}   [upload]  Determines if logs are uploaded.
 * @param {Boolean}   [silent]  Flag indicating if we print to stdout or not.
 */
function Logger (name, level, upload, silent) {
  this._logLevel = level || this.LEVELS.DEBUG;
  this._name = name || '';
  this._upload = upload || false;
  this._silent = silent || false;
}
module.exports = Logger;

Logger.prototype.LEVELS = LEVELS;
Logger.LEVELS = LEVELS;


/**
 * @private
 * Log output to stdout with format: "2014-06-26T16:42:11.139Z LoggerName:"
 * @param   {Number}  level
 * @param   {Array}   args
 * @return  {String}
 */
Logger.prototype._log = function(level, args) {
  var l = new Log(level, this.getName(), args);

  if (this._upload) {
    Storage.writeLog(l);
  }

  return l.print(!this.isSilent());
};


/**
 * @public
 * Toggle printing out logs to stdout.
 * @param {Boolean} silent
 */
Logger.prototype.setSilent = function (silent) {
  this._silent = silent || false;
};


/**
 * @public
 * Determine if this logger is printing to stdout.
 * @returns {Boolean}
 */
Logger.prototype.isSilent = function () {
  return this._silent;
};


/**
 * @public
 * Log a message a current log level
 * Log a string and return the string value of the provided log args.
 * This operates in the same manner as console.
 * @param [arguments] arguments The list of args to log.
 * @returns {String}
 */
Logger.prototype.log = function () {
  return this._log(this.getLogLevel(), arguments);
};


/**
 * @public
 * Log a message at 'DEBUG' level
 * Log a string and return the string value of the provided log args.
 * This operates in the same manner as console.debug
 * @param [arguments] arguments The list of args to log.
 * @returns {String}
 */
Logger.prototype.debug = function () {
  return this._log(LEVELS.DEBUG, arguments);
};


/**
 * @public
 * Log a message at 'INFO' level
 * Log a string and return the string value of the provided log args.
 * This operates in the same manner as console.info
 * @param [arguments] arguments The list of args to log.
 * @returns {String}
 */
Logger.prototype.info = function () {
  return this._log(LEVELS.INFO, arguments);
};


/**
 * @public
 * Log a message at 'WARN' level
 * Log a string and return the string value of the provided log args.
 * This operates in the same manner as console.warn
 * @param [arguments] arguments The list of args to log.
 * @returns {String}
 */
Logger.prototype.warn = function () {
  return this._log(LEVELS.WARN, arguments);
};


/**
 * @public
 * Log a message at 'ERROR' level
 * Log a string and return the string value of the provided log args.
 * This operates in the same manner as console.error
 * @param [arguments] arguments The list of args to log.
 * @returns {String}
 */
Logger.prototype.err = function () {
  return this._log(LEVELS.ERROR, arguments);
};


/**
 * @public
 * Log a message at 'ERROR' level
 * Log a string and return the string value of the provided log args.
 * This operates in the same manner as console.error
 * @param [arguments] arguments The list of args to log.
 * @returns {String}
 */
Logger.prototype.error = Logger.prototype.err;


/**
 * @public
 * Set the level of this logger for calls to the .log instance method.
 * @param {Number} lvl
 */
Logger.prototype.setLogLevel = function (lvl) {
  this._logLevel = lvl;
};


/**
 * @public
 * Get the level of this logger used by calls to the .log instance method.
 * @returns {Number}
 */
Logger.prototype.getLogLevel = function () {
  return this._logLevel;
};


/**
 * @public
 * Get the name of this logger.
 * @returns {String}
 */
Logger.prototype.getName = function () {
  return this._name;
};


/**
 * @public
 * Set the name of this logger. It would be very unusual to use this.
 * @param {String} name
 */
Logger.prototype.setName = function(name) {
  this._name = name;
};

},{"./Levels":5,"./Log":6,"./Storage":9}],8:[function(require,module,exports){
'use strict';

var Logger = require('./Logger')
  , Uploader = require('./Uploader')
  , LEVELS = require('./Levels');


// Map of loggers created. Same name loggers exist only once.
var loggers = {};

/**
 * @constructor
 * @private
 * Used to create instances
 */
function LoggerFactory () {
  this.LEVELS = LEVELS;
}

module.exports = new LoggerFactory();

/**
 * @public
 * Get a named logger instance creating it if it doesn't already exist.
 * @param   {String}    [name]
 * @param   {Number}    [level]
 * @param   {Boolean}   [upload]
 * @param   {Boolean}   [silent]
 * @returns {Logger}
 */
LoggerFactory.prototype.getLogger = function (name, level, upload, silent) {
  name = name || '';

  if (upload) {
    Uploader.startInterval();
  }

  if (loggers[name]) {
    return loggers[name];
  } else {
    loggers[name] = new Logger(name, level, upload, silent);

    return loggers[name];
  }
};


/**
 * @public
 * Set the function that will be used to upload logs.
 * @param {Function} uploadFn
 */
LoggerFactory.prototype.setUploadFn = Uploader.setUploadFn;


/**
 * @public
 * Force logs to upload at this time.
 * @param {Function} [callback]
 */
LoggerFactory.prototype.upload = Uploader.upload;

},{"./Levels":5,"./Logger":7,"./Uploader":10}],9:[function(require,module,exports){
'use strict';

// Filthy hack for node.js testing, in the future storage should be shelled
// out to storage adapter classes and this acts as an interface only
var w = {};
if (typeof window !== 'undefined') {
  w = window;
}

var ls = w.localStorage
  , safejson = require('safejson');

var INDEX_KEY = '_log_indexes_';


/**
 * Generate an index from a given Log Object.
 * @param {Log} log
 */
function genIndex (log) {
  return '_logs_' + log.getDate();
}


/**
 * Get all indexes (days of logs)
 * @param {Function}
 */
var getIndexes = exports.getIndexes = function (callback) {
  var indexes = ls.getItem(INDEX_KEY);

  safejson.parse(indexes, function (err, res) {
    if (err) {
      return callback(err, null);
    } else {
      res = res || [];
      return callback(null, res);
    }
  });
};


/**
 * Update log indexes based on a new log.
 * @param {Log}       log
 * @param {Function}  callback
 */
function updateIndexes (log, callback) {
  getIndexes(function (err, indexes) {
    var idx = genIndex(log);

    // Do we update indexes?
    if (indexes.indexOf(idx) === -1) {
      indexes.push(idx);

      safejson.stringify(indexes, function (err, idxs) {
        try {
          ls.setItem(idx, idxs);
          return callback(null, indexes);
        } catch (e) {
          return callback(e, null);
        }
      });
    } else {
      return callback(null, null);
    }
  });
}


/**
 * Get all logs for a date/index
 * @param {String}    index
 * @param {Function}  callback
 */
var getLogsForIndex = exports.getLogsForIndex = function (index, callback) {
  safejson.parse(ls.getItem(index), function (err, logs) {
    if (err) {
      return callback(err, null);
    } else {
      // If this date isn't created yet, do so now
      logs = logs || [];

      return callback(null, logs);
    }
  });
};


/**
 * Save logs for the given date (index)
 * @param {String}
 * @param {Array}
 * @param {Function}
 */
function saveLogsForIndex (logsIndex, logs, callback) {
  safejson.stringify(logs, function (err, res) {
    if (err) {
      return callback(err, null);
    } else {
      ls.setItem(logsIndex, res);

      return callback(null, logs);
    }
  });
}


/**
 * Write a log to permanent storage
 * @param {Log}
 * @param {Function}
 */
exports.writeLog = function (log, callback) {
  updateIndexes(log, function (err) {
    if (err) {
      return callback(err, null);
    }

    var logsIndex = genIndex(log);

    getLogsForIndex(logsIndex, function (err, logs) {
      logs.push(log.toJSON());

      saveLogsForIndex(logsIndex, logs, callback);
    });
  });
};

},{"safejson":13}],10:[function(require,module,exports){
'use strict';

var Storage = require('./Storage')
  , safejson = require('safejson');


var uploadFn = null
  , uploadInProgress = false
  , uploadTimer = null;


function defaultUploadCallback(err) {
  if (err) {
    console.error('logger encountered an error uploading logs', err);
  }
}


/**
 * Start the timer to upload logs in intervals.
 */
exports.startInterval = function () {
  if (!uploadTimer) {
    var self = this;

    uploadTimer = setInterval(function () {
      self.upload();
    }, 60000);
  }
};


/**
 * Set the function that should be used to upload logs.
 * @param {Function} fn
 */
exports.setUploadFn = function (fn) {
  uploadFn = fn;
};


/**
 * Get the function being used to upload logs.
 * @return {Function}
 */
exports.getUploadFn = function () {
  return uploadFn;
};


/**
 * Upload logs, always uploads the oldest day of logs first.
 * @param {Function}
 */
exports.upload = function (callback) {
  // Set a callback for upload complete
  callback = callback || defaultUploadCallback;

  if (!uploadFn) {
    return callback('Called upload without setting an upload function');
  }

  if (!uploadInProgress) {
    console.log('Upload already in progress. Skipping second call.');
    return callback(null, null);
  }

  // Flag that we are uploading
  uploadInProgress = true;

  Storage.getIndexes(function (err, idxs) {
    if (idxs.length === 0) {
      uploadInProgress = false;

      return callback(null, null);
    }

    // Oldest logs should be uploaded first
    var date = idxs.sort()[0];

    Storage.getLogsForIndex(date, function (err, logs) {
      if (err) {
        uploadInProgress = false;

        return callback(err, null);
      }

      safejson.stringify(logs, function (err, str) {
        uploadFn(str,  function (err) {
          uploadInProgress = false;
          callback(err, null);
        });
      });
    });
  });
};

},{"./Storage":9,"safejson":13}],11:[function(require,module,exports){
(function (process){
'use strict';

var LEVELS = require('../Levels');

/**
 * Logs output using Node.js stdin/stderr stream.
 * @private
 * @param {Number} level
 * @param {String} str
 */
function nodeLog (level, str) {
  if (level === LEVELS.ERROR) {
    process.stderr.write(str + '\n');
  } else {
    process.stdout.write(str + '\n');
  }
}


/**
 * Logs output using the browser's console object.
 * @private
 * @param {Number} level
 * @param {String} str
 */
function browserLog (level, str) {
  var logFn = console.log;

  switch (level) {
    case LEVELS.DEBUG:
      // console.debug is not available in Node land
      logFn = console.debug || console.log;
      break;
    case LEVELS.INFO:
      // console.info is not available in Node land either
      logFn = console.info || console.log;
      break;
    case LEVELS.WARN:
      logFn = console.warn;
      break;
    case LEVELS.ERROR:
      logFn = console.error;
      break;
  }

  logFn.call(console, str);
}


if (typeof window === 'undefined') {
  module.exports = nodeLog;
} else {
  module.exports = browserLog;
}

}).call(this,require("FWaASH"))
},{"../Levels":5,"FWaASH":2}],12:[function(require,module,exports){
'use strict';


exports.transports = {
  'console': require('./console')
};

// Transports to use, default inclues console
var activeTransports = [exports.transports.console];

/**
 * Log the provided log to the active transports.
 * @public
 * @param {Number} level
 * @param {String} str
 */
exports.log = function (level, str) {
  for (var i in activeTransports) {
    activeTransports[i](level, str);
  }
};

},{"./console":11}],13:[function(require,module,exports){
(function (process){
// Determines wether actions should be deferred for processing
exports.defer = false;


/**
 * Defer a function call momentairly.
 * @param {Function} fn
 */
function deferred(fn) {
  if (exports.defer === true) {
    process.nextTick(fn);
  } else {
    fn();
  }
}


/**
 * Stringify JSON and catch any possible exceptions.
 * @param {Object}    json
 * @param {Function}  [replacer]
 * @param {Number}    [spaces]
 * @param {Function}  callback
 */
exports.stringify = function (/*json, replacer, spaces, callback*/) {
  var args = Array.prototype.slice.call(arguments)
    , callback = args.splice(args.length - 1, args.length)[0];

  deferred(function() {
    try {
      return callback(null, JSON.stringify.apply(null, args));
    } catch (e) {
      return callback(e, null);
    }
  });
};


/**
 * Parse string of JSON and catch any possible exceptions.
 * @param {String}    json
 * @param {Function}  [reviver]
 * @param {Function}  callback
 */
exports.parse = function (/*json, reviver, callback*/) {
  var args = Array.prototype.slice.call(arguments)
    , callback = args.splice(args.length - 1, args.length)[0];

  deferred(function() {
    try {
      return callback(null, JSON.parse.apply(null, args));
    } catch (e) {
      return callback(e, null);
    }
  });
};
}).call(this,require("FWaASH"))
},{"FWaASH":2}],14:[function(require,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],15:[function(require,module,exports){
'use strict';

var fhlog = require('fhlog');

module.exports = function () {
  // Simply use fhlog! May change...
  return fhlog;
};

},{"fhlog":8}],16:[function(require,module,exports){
'use strict';

module.exports = angular.module('ngFH')
  .factory('Log', require('./Log.js'));

},{"./Log.js":15}],17:[function(require,module,exports){
'use strict';

// Register ngFH module
module.exports = angular.module('ngFH', ['ng']);

// Bind our modules to ngFH
require('./factories');
require('./services');

},{"./factories":16,"./services":21}],18:[function(require,module,exports){
'use strict';

var fh = $fh // Once fh-js-sdk is on npm we can require it here
  , printLogs = true
  , defaultTimeout = 30 * 1000;


/**
 * Service to represent FH.Act
 * @module Act
 */
module.exports = function (Utils, Log, $q, $timeout) {
  var log = Log.getLogger('FH.Act');

  // Error strings used for error type detection
  var ACT_ERRORS = {
    PARSE_ERROR: 'parseerror',
    NO_ACTNAME: 'act_no_action',
    UNKNOWN_ACT: 'no such function',
    INTERNAL_ERROR: 'internal error in',
    TIMEOUT: 'timeout'
  };

  /**
   * Exposed error types for checks by developers.
   * @public
   */
  var ERRORS = this.ERRORS = {
    NO_ACTNAME_PROVIDED: 'NO_ACTNAME_PROVIDED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    UNKNOWN_ACT: 'UNKNOWN_ACT',
    CLOUD_ERROR: 'CLOUD_ERROR',
    TIMEOUT: 'TIMEOUT',
    PARSE_ERROR: 'PARSE_ERROR',
    NO_NETWORK: 'NO_NETWORK'
  };


  /**
   * Called on a successful act call (when main.js callback is called with a
   * null error param)
   * @private
   * @param   {String}      actname
   * @param   {Object}      res
   * @param   {Function}    callback
   * @returns {Object}
   */
  function parseSuccess(actname, res) {
    log.debug('Called "' + actname + '" successfully.');

    return res;
  }


  /**
   * Called when an act call has failed. Creates a meaningful error string.
   * @private
   * @param   {String}      actname
   * @param   {String}      err
   * @param   {Object}      details
   * @returns {Object}
   */
  function parseFail(actname, err, details) {
    var ERR = null;

    if (err === ACT_ERRORS.NO_ACTNAME) {
      ERR = ERRORS.NO_ACTNAME_PROVIDED;
    } else if (err !== 'error_ajaxfail') {
      ERR = ERRORS.UNKNOWN_ERROR;
    } else if (err === ERRORS.NO_ACTNAME_PROVIDED) {
      ERR = ERRORS.NO_ACTNAME_PROVIDED;
    } else if (
      details.error.toLowerCase().indexOf(ACT_ERRORS.UNKNOWN_ACT) >= 0) {
      ERR = ERRORS.UNKNOWN_ACT;
    } else if (
      details.message.toLowerCase().indexOf(ACT_ERRORS.TIMEOUT) >= 0) {
      ERR = ERRORS.TIMEOUT;
    } else if (details.message === ACT_ERRORS.PARSE_ERROR) {
      ERR = ERRORS.PARSE_ERROR;
    } else {
      // Cloud code sent error to it's callback
      log.debug('"%s" encountered an error in it\'s cloud code. Error ' +
        'String: %s, Error Object: %o', actname, err, details);
      ERR = ERRORS.CLOUD_ERROR;
    }

    log.debug('"%s" failed with error %s', actname, ERR);

    return {
      type: ERR,
      err: err,
      msg: details
    };
  }


  /**
   * Call an action on the cloud.
   * @public
   * @param   {Object}      opts
   * @param   {Function}    [callback]
   * @returns {Promise|null}
   */
  this.request = function(opts) {
    var deferred = $q.defer()
      , success
      , fail;

    // Defer call so we can return promise first
    if (Utils.isOnline()) {
      log.debug('Making call with opts %j', opts);

      success = Utils.safeCallback(function (res) {
        deferred.resolve(parseSuccess(opts.act, res));
      });

      fail = Utils.safeCallback(function (err, msg) {
        deferred.reject(parseFail(opts.act, err, msg));
      });

      fh.act(opts, success, fail);
    } else {
      log.debug('Can\'t make act call, no netowrk. Opts: %j', opts);

      $timeout(function () {
        deferred.reject({
          type: ERRORS.NO_NETWORK,
          err: null,
          msg: null
        });
      });
    }

    return deferred.promise;
  };


  /**
   * Get the default timeout for Act calls in milliseconds
   * @public
   * @returns {Number}
   */
  this.getDefaultTimeout = function () {
    return defaultTimeout;
  };


  /**
   * Set the default timeout for Act calls in milliseconds
   * @public
   * @param {Number} t The timeout, in milliseconds, to use
   */
  this.setDefaultTimeout = function(t) {
    defaultTimeout = t;
  };


  /**
   * Disbale debugging logging by this service
   * @public
   */
  this.disableLogging = function() {
    log.setSilent(true);
  };

  /**
   * Enable debug logging by this service
   * @public
   */
  this.enableLogging = function() {
    log.setSilent(false);
  };
};

},{}],19:[function(require,module,exports){
'use strict';

var xtend = require('xtend')
  , fh = $fh // Once fh-js-sdk is on npm we can require it here
  , printLogs = true
  , timeout = 30 * 1000;

var DEFAULT_OPTS = {
  type: 'GET',
  path: '/cloud/',
  timeout: timeout,
  contentType: 'application/json',
  data: {}
};

/**
 * Service to represent FH.Cloud
 * @module Cloud
 */
module.exports = function (Utils, Log, $q, $timeout) {
  var log = Log.getLogger('FH.Cloud');

  /**
   * Perform the cloud request returning a promise or null.
   * @private
   * @param   {Object}    opts
   * @param   {Function}  [callback]
   * @returns {Promise|null}
   */
  function cloudRequest (opts, callback) {
    var promise = null;

    // Define all options
    opts = xtend(DEFAULT_OPTS, opts);

    // We need to use promises as user didn't provide a callback
    if (!callback) {
      promise = $q.defer();

      callback = function (err, res) {
        if (err) {
          promise.reject(err);
        } else {
          promise.resolve(res);
        }
      };
    }

    // Defer call so we can return promise
    $timeout(function () {
      log.debug('Call with options: %j', opts);

      fh.cloud(opts, Utils.onSuccess(callback), Utils.onFail(callback));
    }, 0);

    // Retrun promise or null
    return (promise !== null) ? promise.promise : null;
  }


  /**
   * Utility fn to save code duplication
   * @private
   * @param   {String} verb
   * @returns {Function}
   */
  function _genVerbFunc (verb) {
    return function (path, data, callback) {
      return cloudRequest({
        path: path,
        data: data,
        type: verb.toUpperCase()
      }, callback);
    };
  }


  /**
   * Shorthand method for GET request.
   * @public
   * @function
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.get          = _genVerbFunc('GET');


  /**
   * Shorthand method for PUT request.
   * @public
   * @function
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.put          = _genVerbFunc('PUT');


  /**
   * Shorthand method for POST request.
   * @public
   * @function
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.post         = _genVerbFunc('POST');


  /**
   * Shorthand method for HEAD request.
   * @public
   * @function
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.head         = _genVerbFunc('HEAD');


  /**
   * Shorthand method for DELETE request.
   * @public
   * @function
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this['delete']    = _genVerbFunc('DELETE');




  /**
   * Manually provide HTTP verb and all options as per SDK docs.
   * @public
   * @param   {Object}    opts      The options to use for the request
   * @param   {Function}  callback  Callback function
   * @returns {Promise|null}
   */
  this.request = function (opts, callback) {
    return cloudRequest(opts, callback);
  };


  /**
   * Get the default timeout for Cloud calls in milliseconds
   * @public
   * @returns {Number}
   */
  this.getDefaultTimeout = function () {
    return timeout;
  };


  /**
   * Set the default timeout for Cloud calls in milliseconds
   * @public
   * @param {Number} t New timeout value in milliseconds
   */
  this.setDefaultTimeout = function(t) {
    timeout = t;
  };


  /**
   * Disbale debugging logging by this service
   * @public
   */
  this.disableLogging = function() {
    printLogs = false;
  };


  /**
   * Enable debug logging by this service
   * @public
   */
  this.enableLogging = function() {
    printLogs = true;
  };
};

},{"xtend":14}],20:[function(require,module,exports){
'use strict';

module.exports = function ($rootScope, $window) {

  /**
   * Safely call a function that modifies variables on a scope.
   * @public
   * @param {Function} fn
   */
  var safeApply = this.safeApply = function (fn, args) {
    var phase = $rootScope.$$phase;

    if (phase === '$apply' || phase === '$digest') {
      if (args) {
        fn.apply(fn, args);
      } else {
        fn();
      }
    } else {
      if (args) {
        $rootScope.$apply(function () {
          fn.apply(fn, args);
        });
      } else {
        $rootScope.$apply(fn);
      }
    }
  };


  /**
   * Wrap a callback for safe execution.
   * If the callback does further async work then this may not work.
   * @param   {Function} callback
   * @returns {Function}
   */
  this.safeCallback = function (callback) {
    return function () {
      var args = Array.prototype.slice.call(arguments);

      safeApply(function () {
        callback.apply(callback, args);
      });
    };
  };


  /**
   * Check for an internet connection.
   * @public
   * @returns {Boolean}
   */
  this.isOnline = function () {
    return $window.navigator.onLine;
  };


  /**
   * Wrap a success callback in Node.js style.
   * @public
   * @param   {Function}
   * @returns {Boolean}
   */
  this.onSuccess = function (fn) {
    return function (res) {
      safeApply(function () {
        fn (null, res);
      });
    };
  };


  /**
   * Wrap a fail callback in Node.js style.
   * @public
   * @param   {Function}
   * @returns {Boolean}
   */
  this.onFail = function (fn) {
    return function (err) {
      safeApply(function () {
        fn (err, null);
      });
    };
  };

};

},{}],21:[function(require,module,exports){
'use strict';

module.exports = angular.module('ngFH')
  .service('Utils', require('./Utils.js'))
  .service('Cloud', require('./Cloud.js'))
  .service('Act', require('./Act.js'));

},{"./Act.js":18,"./Cloud.js":19,"./Utils.js":20}]},{},[17])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL2xpYi9MZXZlbHMuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL2xpYi9Mb2cuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL2xpYi9Mb2dnZXIuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL2xpYi9Mb2dnZXJGYWN0b3J5LmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L25vZGVfbW9kdWxlcy9maGxvZy9saWIvU3RvcmFnZS5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9ub2RlX21vZHVsZXMvZmhsb2cvbGliL1VwbG9hZGVyLmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L25vZGVfbW9kdWxlcy9maGxvZy9saWIvdHJhbnNwb3J0L2NvbnNvbGUuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL2xpYi90cmFuc3BvcnQvaW5kZXguanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL25vZGVfbW9kdWxlcy9zYWZlanNvbi9zcmMvaW5kZXguanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL3h0ZW5kL2ltbXV0YWJsZS5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9zcmMvZmFjdG9yaWVzL0xvZy5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9zcmMvZmFjdG9yaWVzL2luZGV4LmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L3NyYy9uZ0ZILmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L3NyYy9zZXJ2aWNlcy9BY3QuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvc3JjL3NlcnZpY2VzL0Nsb3VkLmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L3NyYy9zZXJ2aWNlcy9VdGlscy5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9zcmMvc2VydmljZXMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiRldhQVNIXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAnREVCVUcnOiAwLFxuICAnSU5GTyc6IDEsXG4gICdXQVJOJzogMixcbiAgJ0VSUk9SJzogM1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJylcbiAgLCB0cmFuc3BvcnQgPSByZXF1aXJlKCcuL3RyYW5zcG9ydCcpXG4gICwgTEVWRUxTID0gcmVxdWlyZSgnLi9MZXZlbHMnKTtcblxuLyoqXG4gKiBAcHVibGljXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKi9cbmZ1bmN0aW9uIExvZyhsZXZlbCwgbmFtZSwgYXJncykge1xuICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncyk7XG5cbiAgdmFyIHRzID0gRGF0ZS5ub3coKVxuICAgICwgbHZsU3RyID0gJydcbiAgICAsIHByZWZpeCA9ICcnO1xuXG4gIHN3aXRjaCAobGV2ZWwpIHtcbiAgICBjYXNlIExFVkVMUy5ERUJVRzpcbiAgICAgIGx2bFN0ciA9ICdERUJVRyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIExFVkVMUy5JTkZPOlxuICAgICAgbHZsU3RyID0gJ0lORk8nO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBMRVZFTFMuV0FSTjpcbiAgICAgIGx2bFN0ciA9ICdXQVJOJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgTEVWRUxTLkVSUk9SOlxuICAgICAgbHZsU3RyID0gJ0VSUk9SJztcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gQnVpbGQgbG9nIHByZWZpeFxuICBwcmVmaXggPSB1dGlsLmZvcm1hdCgnJXMgJXMgJXM6ICcsIG5ldyBEYXRlKHRzKS50b0pTT04oKSwgbHZsU3RyLCBuYW1lKTtcblxuICAvLyBOb3JtYWxpc2UgZmlyc3QgYXJnIHRvIGEgaW5jbHVkZSBvdXIgc3RyaW5nIGlmIG5lY2Vzc2FyeVxuICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnKSB7XG4gICAgYXJnc1swXSA9IHByZWZpeCArIGFyZ3NbMF07XG4gIH1cblxuICAvLyBGb3JtYXQgdGhlIHN0cmluZyBzbyB3ZSBjYW4gc2F2ZSBpdCBhbmQgb3V0cHV0IGl0IGNvcnJlY3RseVxuICB0aGlzLnRleHQgPSB1dGlsLmZvcm1hdC5hcHBseSh1dGlsLCBhcmdzKTtcbiAgdGhpcy50cyA9IHRzO1xuICB0aGlzLmxldmVsID0gbGV2ZWw7XG4gIHRoaXMubmFtZSA9IG5hbWU7XG59XG5tb2R1bGUuZXhwb3J0cyA9IExvZztcblxuXG4vKipcbiAqIFdyaXRlIHRoZSBjb250ZW50cyBvZiB0aGlzIGxvZyB0byBvdXRwdXQgdHJhbnNwb3J0XG4gKiBAcGFyYW0gICB7Qm9vbGVhbn0gc2lsZW50XG4gKiBAcmV0dXJuICB7U3RyaW5nfVxuICovXG5Mb2cucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24gKHByaW50KSB7XG4gIGlmIChwcmludCkge1xuICAgIHRyYW5zcG9ydC5sb2codGhpcy5sZXZlbCwgdGhpcy50ZXh0KTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLnRleHQ7XG59O1xuXG5cbi8qKlxuICogR2V0IHRoZSBkYXRlIHRoYXQgdGhpcyBsb2cgd2FzIGNyZWF0ZWQuXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbkxvZy5wcm90b3R5cGUuZ2V0RGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyBEYXRlKHRoaXMudHMpLnRvSlNPTigpLnN1YnN0cigwLCAxMCk7XG59O1xuXG5cbi8qKlxuICogUmV0dXJuIGEgSlNPTiBvYmplY3QgcmVwcmVzZW50aW5nIHRoaXMgbG9nLlxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5Mb2cucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0czogdGhpcy50cyxcbiAgICB0ZXh0OiB0aGlzLnRleHQsXG4gICAgbmFtZTogdGhpcy5uYW1lLFxuICAgIGxldmVsOiB0aGlzLmxldmVsXG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTG9nID0gcmVxdWlyZSgnLi9Mb2cnKVxuICAsIFN0b3JhZ2UgPSByZXF1aXJlKCcuL1N0b3JhZ2UnKVxuICAsIExFVkVMUyA9IHJlcXVpcmUoJy4vTGV2ZWxzJyk7XG5cblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIFdyYXBwZXIgZm9yIHRoZSBjb25zb2xlIG9iamVjdC5cbiAqIFNob3VsZCBiZWhhdmUgdGhlIHNhbWUgYXMgY29uc29sZS5NRVRIT0RcbiAqIEBwYXJhbSB7U3RyaW5nfSAgICBbbmFtZV0gICAgTmFtZSBvZiB0aGlzIGxvZ2dlciB0byBpbmNsdWRlIGluIGxvZ3MuXG4gKiBAcGFyYW0ge051bWJlcn0gICAgW2xldmVsXSAgIExldmVsIHRvIHVzZSBmb3IgY2FsbHMgdG8gLmxvZ1xuICogQHBhcmFtIHtCb29sZWFufSAgIFt1cGxvYWRdICBEZXRlcm1pbmVzIGlmIGxvZ3MgYXJlIHVwbG9hZGVkLlxuICogQHBhcmFtIHtCb29sZWFufSAgIFtzaWxlbnRdICBGbGFnIGluZGljYXRpbmcgaWYgd2UgcHJpbnQgdG8gc3Rkb3V0IG9yIG5vdC5cbiAqL1xuZnVuY3Rpb24gTG9nZ2VyIChuYW1lLCBsZXZlbCwgdXBsb2FkLCBzaWxlbnQpIHtcbiAgdGhpcy5fbG9nTGV2ZWwgPSBsZXZlbCB8fCB0aGlzLkxFVkVMUy5ERUJVRztcbiAgdGhpcy5fbmFtZSA9IG5hbWUgfHwgJyc7XG4gIHRoaXMuX3VwbG9hZCA9IHVwbG9hZCB8fCBmYWxzZTtcbiAgdGhpcy5fc2lsZW50ID0gc2lsZW50IHx8IGZhbHNlO1xufVxubW9kdWxlLmV4cG9ydHMgPSBMb2dnZXI7XG5cbkxvZ2dlci5wcm90b3R5cGUuTEVWRUxTID0gTEVWRUxTO1xuTG9nZ2VyLkxFVkVMUyA9IExFVkVMUztcblxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBMb2cgb3V0cHV0IHRvIHN0ZG91dCB3aXRoIGZvcm1hdDogXCIyMDE0LTA2LTI2VDE2OjQyOjExLjEzOVogTG9nZ2VyTmFtZTpcIlxuICogQHBhcmFtICAge051bWJlcn0gIGxldmVsXG4gKiBAcGFyYW0gICB7QXJyYXl9ICAgYXJnc1xuICogQHJldHVybiAge1N0cmluZ31cbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5fbG9nID0gZnVuY3Rpb24obGV2ZWwsIGFyZ3MpIHtcbiAgdmFyIGwgPSBuZXcgTG9nKGxldmVsLCB0aGlzLmdldE5hbWUoKSwgYXJncyk7XG5cbiAgaWYgKHRoaXMuX3VwbG9hZCkge1xuICAgIFN0b3JhZ2Uud3JpdGVMb2cobCk7XG4gIH1cblxuICByZXR1cm4gbC5wcmludCghdGhpcy5pc1NpbGVudCgpKTtcbn07XG5cblxuLyoqXG4gKiBAcHVibGljXG4gKiBUb2dnbGUgcHJpbnRpbmcgb3V0IGxvZ3MgdG8gc3Rkb3V0LlxuICogQHBhcmFtIHtCb29sZWFufSBzaWxlbnRcbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5zZXRTaWxlbnQgPSBmdW5jdGlvbiAoc2lsZW50KSB7XG4gIHRoaXMuX3NpbGVudCA9IHNpbGVudCB8fCBmYWxzZTtcbn07XG5cblxuLyoqXG4gKiBAcHVibGljXG4gKiBEZXRlcm1pbmUgaWYgdGhpcyBsb2dnZXIgaXMgcHJpbnRpbmcgdG8gc3Rkb3V0LlxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbkxvZ2dlci5wcm90b3R5cGUuaXNTaWxlbnQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLl9zaWxlbnQ7XG59O1xuXG5cbi8qKlxuICogQHB1YmxpY1xuICogTG9nIGEgbWVzc2FnZSBhIGN1cnJlbnQgbG9nIGxldmVsXG4gKiBMb2cgYSBzdHJpbmcgYW5kIHJldHVybiB0aGUgc3RyaW5nIHZhbHVlIG9mIHRoZSBwcm92aWRlZCBsb2cgYXJncy5cbiAqIFRoaXMgb3BlcmF0ZXMgaW4gdGhlIHNhbWUgbWFubmVyIGFzIGNvbnNvbGUuXG4gKiBAcGFyYW0gW2FyZ3VtZW50c10gYXJndW1lbnRzIFRoZSBsaXN0IG9mIGFyZ3MgdG8gbG9nLlxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5sb2cgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLl9sb2codGhpcy5nZXRMb2dMZXZlbCgpLCBhcmd1bWVudHMpO1xufTtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIExvZyBhIG1lc3NhZ2UgYXQgJ0RFQlVHJyBsZXZlbFxuICogTG9nIGEgc3RyaW5nIGFuZCByZXR1cm4gdGhlIHN0cmluZyB2YWx1ZSBvZiB0aGUgcHJvdmlkZWQgbG9nIGFyZ3MuXG4gKiBUaGlzIG9wZXJhdGVzIGluIHRoZSBzYW1lIG1hbm5lciBhcyBjb25zb2xlLmRlYnVnXG4gKiBAcGFyYW0gW2FyZ3VtZW50c10gYXJndW1lbnRzIFRoZSBsaXN0IG9mIGFyZ3MgdG8gbG9nLlxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX2xvZyhMRVZFTFMuREVCVUcsIGFyZ3VtZW50cyk7XG59O1xuXG5cbi8qKlxuICogQHB1YmxpY1xuICogTG9nIGEgbWVzc2FnZSBhdCAnSU5GTycgbGV2ZWxcbiAqIExvZyBhIHN0cmluZyBhbmQgcmV0dXJuIHRoZSBzdHJpbmcgdmFsdWUgb2YgdGhlIHByb3ZpZGVkIGxvZyBhcmdzLlxuICogVGhpcyBvcGVyYXRlcyBpbiB0aGUgc2FtZSBtYW5uZXIgYXMgY29uc29sZS5pbmZvXG4gKiBAcGFyYW0gW2FyZ3VtZW50c10gYXJndW1lbnRzIFRoZSBsaXN0IG9mIGFyZ3MgdG8gbG9nLlxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5pbmZvID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5fbG9nKExFVkVMUy5JTkZPLCBhcmd1bWVudHMpO1xufTtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIExvZyBhIG1lc3NhZ2UgYXQgJ1dBUk4nIGxldmVsXG4gKiBMb2cgYSBzdHJpbmcgYW5kIHJldHVybiB0aGUgc3RyaW5nIHZhbHVlIG9mIHRoZSBwcm92aWRlZCBsb2cgYXJncy5cbiAqIFRoaXMgb3BlcmF0ZXMgaW4gdGhlIHNhbWUgbWFubmVyIGFzIGNvbnNvbGUud2FyblxuICogQHBhcmFtIFthcmd1bWVudHNdIGFyZ3VtZW50cyBUaGUgbGlzdCBvZiBhcmdzIHRvIGxvZy5cbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbkxvZ2dlci5wcm90b3R5cGUud2FybiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX2xvZyhMRVZFTFMuV0FSTiwgYXJndW1lbnRzKTtcbn07XG5cblxuLyoqXG4gKiBAcHVibGljXG4gKiBMb2cgYSBtZXNzYWdlIGF0ICdFUlJPUicgbGV2ZWxcbiAqIExvZyBhIHN0cmluZyBhbmQgcmV0dXJuIHRoZSBzdHJpbmcgdmFsdWUgb2YgdGhlIHByb3ZpZGVkIGxvZyBhcmdzLlxuICogVGhpcyBvcGVyYXRlcyBpbiB0aGUgc2FtZSBtYW5uZXIgYXMgY29uc29sZS5lcnJvclxuICogQHBhcmFtIFthcmd1bWVudHNdIGFyZ3VtZW50cyBUaGUgbGlzdCBvZiBhcmdzIHRvIGxvZy5cbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbkxvZ2dlci5wcm90b3R5cGUuZXJyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5fbG9nKExFVkVMUy5FUlJPUiwgYXJndW1lbnRzKTtcbn07XG5cblxuLyoqXG4gKiBAcHVibGljXG4gKiBMb2cgYSBtZXNzYWdlIGF0ICdFUlJPUicgbGV2ZWxcbiAqIExvZyBhIHN0cmluZyBhbmQgcmV0dXJuIHRoZSBzdHJpbmcgdmFsdWUgb2YgdGhlIHByb3ZpZGVkIGxvZyBhcmdzLlxuICogVGhpcyBvcGVyYXRlcyBpbiB0aGUgc2FtZSBtYW5uZXIgYXMgY29uc29sZS5lcnJvclxuICogQHBhcmFtIFthcmd1bWVudHNdIGFyZ3VtZW50cyBUaGUgbGlzdCBvZiBhcmdzIHRvIGxvZy5cbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbkxvZ2dlci5wcm90b3R5cGUuZXJyb3IgPSBMb2dnZXIucHJvdG90eXBlLmVycjtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIFNldCB0aGUgbGV2ZWwgb2YgdGhpcyBsb2dnZXIgZm9yIGNhbGxzIHRvIHRoZSAubG9nIGluc3RhbmNlIG1ldGhvZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBsdmxcbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5zZXRMb2dMZXZlbCA9IGZ1bmN0aW9uIChsdmwpIHtcbiAgdGhpcy5fbG9nTGV2ZWwgPSBsdmw7XG59O1xuXG5cbi8qKlxuICogQHB1YmxpY1xuICogR2V0IHRoZSBsZXZlbCBvZiB0aGlzIGxvZ2dlciB1c2VkIGJ5IGNhbGxzIHRvIHRoZSAubG9nIGluc3RhbmNlIG1ldGhvZC5cbiAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gKi9cbkxvZ2dlci5wcm90b3R5cGUuZ2V0TG9nTGV2ZWwgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLl9sb2dMZXZlbDtcbn07XG5cblxuLyoqXG4gKiBAcHVibGljXG4gKiBHZXQgdGhlIG5hbWUgb2YgdGhpcyBsb2dnZXIuXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5Mb2dnZXIucHJvdG90eXBlLmdldE5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLl9uYW1lO1xufTtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIFNldCB0aGUgbmFtZSBvZiB0aGlzIGxvZ2dlci4gSXQgd291bGQgYmUgdmVyeSB1bnVzdWFsIHRvIHVzZSB0aGlzLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5zZXROYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICB0aGlzLl9uYW1lID0gbmFtZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBMb2dnZXIgPSByZXF1aXJlKCcuL0xvZ2dlcicpXG4gICwgVXBsb2FkZXIgPSByZXF1aXJlKCcuL1VwbG9hZGVyJylcbiAgLCBMRVZFTFMgPSByZXF1aXJlKCcuL0xldmVscycpO1xuXG5cbi8vIE1hcCBvZiBsb2dnZXJzIGNyZWF0ZWQuIFNhbWUgbmFtZSBsb2dnZXJzIGV4aXN0IG9ubHkgb25jZS5cbnZhciBsb2dnZXJzID0ge307XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICogVXNlZCB0byBjcmVhdGUgaW5zdGFuY2VzXG4gKi9cbmZ1bmN0aW9uIExvZ2dlckZhY3RvcnkgKCkge1xuICB0aGlzLkxFVkVMUyA9IExFVkVMUztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgTG9nZ2VyRmFjdG9yeSgpO1xuXG4vKipcbiAqIEBwdWJsaWNcbiAqIEdldCBhIG5hbWVkIGxvZ2dlciBpbnN0YW5jZSBjcmVhdGluZyBpdCBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKiBAcGFyYW0gICB7U3RyaW5nfSAgICBbbmFtZV1cbiAqIEBwYXJhbSAgIHtOdW1iZXJ9ICAgIFtsZXZlbF1cbiAqIEBwYXJhbSAgIHtCb29sZWFufSAgIFt1cGxvYWRdXG4gKiBAcGFyYW0gICB7Qm9vbGVhbn0gICBbc2lsZW50XVxuICogQHJldHVybnMge0xvZ2dlcn1cbiAqL1xuTG9nZ2VyRmFjdG9yeS5wcm90b3R5cGUuZ2V0TG9nZ2VyID0gZnVuY3Rpb24gKG5hbWUsIGxldmVsLCB1cGxvYWQsIHNpbGVudCkge1xuICBuYW1lID0gbmFtZSB8fCAnJztcblxuICBpZiAodXBsb2FkKSB7XG4gICAgVXBsb2FkZXIuc3RhcnRJbnRlcnZhbCgpO1xuICB9XG5cbiAgaWYgKGxvZ2dlcnNbbmFtZV0pIHtcbiAgICByZXR1cm4gbG9nZ2Vyc1tuYW1lXTtcbiAgfSBlbHNlIHtcbiAgICBsb2dnZXJzW25hbWVdID0gbmV3IExvZ2dlcihuYW1lLCBsZXZlbCwgdXBsb2FkLCBzaWxlbnQpO1xuXG4gICAgcmV0dXJuIGxvZ2dlcnNbbmFtZV07XG4gIH1cbn07XG5cblxuLyoqXG4gKiBAcHVibGljXG4gKiBTZXQgdGhlIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHVwbG9hZCBsb2dzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gdXBsb2FkRm5cbiAqL1xuTG9nZ2VyRmFjdG9yeS5wcm90b3R5cGUuc2V0VXBsb2FkRm4gPSBVcGxvYWRlci5zZXRVcGxvYWRGbjtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIEZvcmNlIGxvZ3MgdG8gdXBsb2FkIGF0IHRoaXMgdGltZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja11cbiAqL1xuTG9nZ2VyRmFjdG9yeS5wcm90b3R5cGUudXBsb2FkID0gVXBsb2FkZXIudXBsb2FkO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBGaWx0aHkgaGFjayBmb3Igbm9kZS5qcyB0ZXN0aW5nLCBpbiB0aGUgZnV0dXJlIHN0b3JhZ2Ugc2hvdWxkIGJlIHNoZWxsZWRcbi8vIG91dCB0byBzdG9yYWdlIGFkYXB0ZXIgY2xhc3NlcyBhbmQgdGhpcyBhY3RzIGFzIGFuIGludGVyZmFjZSBvbmx5XG52YXIgdyA9IHt9O1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHcgPSB3aW5kb3c7XG59XG5cbnZhciBscyA9IHcubG9jYWxTdG9yYWdlXG4gICwgc2FmZWpzb24gPSByZXF1aXJlKCdzYWZlanNvbicpO1xuXG52YXIgSU5ERVhfS0VZID0gJ19sb2dfaW5kZXhlc18nO1xuXG5cbi8qKlxuICogR2VuZXJhdGUgYW4gaW5kZXggZnJvbSBhIGdpdmVuIExvZyBPYmplY3QuXG4gKiBAcGFyYW0ge0xvZ30gbG9nXG4gKi9cbmZ1bmN0aW9uIGdlbkluZGV4IChsb2cpIHtcbiAgcmV0dXJuICdfbG9nc18nICsgbG9nLmdldERhdGUoKTtcbn1cblxuXG4vKipcbiAqIEdldCBhbGwgaW5kZXhlcyAoZGF5cyBvZiBsb2dzKVxuICogQHBhcmFtIHtGdW5jdGlvbn1cbiAqL1xudmFyIGdldEluZGV4ZXMgPSBleHBvcnRzLmdldEluZGV4ZXMgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgdmFyIGluZGV4ZXMgPSBscy5nZXRJdGVtKElOREVYX0tFWSk7XG5cbiAgc2FmZWpzb24ucGFyc2UoaW5kZXhlcywgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyA9IHJlcyB8fCBbXTtcbiAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCByZXMpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5cbi8qKlxuICogVXBkYXRlIGxvZyBpbmRleGVzIGJhc2VkIG9uIGEgbmV3IGxvZy5cbiAqIEBwYXJhbSB7TG9nfSAgICAgICBsb2dcbiAqIEBwYXJhbSB7RnVuY3Rpb259ICBjYWxsYmFja1xuICovXG5mdW5jdGlvbiB1cGRhdGVJbmRleGVzIChsb2csIGNhbGxiYWNrKSB7XG4gIGdldEluZGV4ZXMoZnVuY3Rpb24gKGVyciwgaW5kZXhlcykge1xuICAgIHZhciBpZHggPSBnZW5JbmRleChsb2cpO1xuXG4gICAgLy8gRG8gd2UgdXBkYXRlIGluZGV4ZXM/XG4gICAgaWYgKGluZGV4ZXMuaW5kZXhPZihpZHgpID09PSAtMSkge1xuICAgICAgaW5kZXhlcy5wdXNoKGlkeCk7XG5cbiAgICAgIHNhZmVqc29uLnN0cmluZ2lmeShpbmRleGVzLCBmdW5jdGlvbiAoZXJyLCBpZHhzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbHMuc2V0SXRlbShpZHgsIGlkeHMpO1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBpbmRleGVzKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBudWxsKTtcbiAgICB9XG4gIH0pO1xufVxuXG5cbi8qKlxuICogR2V0IGFsbCBsb2dzIGZvciBhIGRhdGUvaW5kZXhcbiAqIEBwYXJhbSB7U3RyaW5nfSAgICBpbmRleFxuICogQHBhcmFtIHtGdW5jdGlvbn0gIGNhbGxiYWNrXG4gKi9cbnZhciBnZXRMb2dzRm9ySW5kZXggPSBleHBvcnRzLmdldExvZ3NGb3JJbmRleCA9IGZ1bmN0aW9uIChpbmRleCwgY2FsbGJhY2spIHtcbiAgc2FmZWpzb24ucGFyc2UobHMuZ2V0SXRlbShpbmRleCksIGZ1bmN0aW9uIChlcnIsIGxvZ3MpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhpcyBkYXRlIGlzbid0IGNyZWF0ZWQgeWV0LCBkbyBzbyBub3dcbiAgICAgIGxvZ3MgPSBsb2dzIHx8IFtdO1xuXG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgbG9ncyk7XG4gICAgfVxuICB9KTtcbn07XG5cblxuLyoqXG4gKiBTYXZlIGxvZ3MgZm9yIHRoZSBnaXZlbiBkYXRlIChpbmRleClcbiAqIEBwYXJhbSB7U3RyaW5nfVxuICogQHBhcmFtIHtBcnJheX1cbiAqIEBwYXJhbSB7RnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIHNhdmVMb2dzRm9ySW5kZXggKGxvZ3NJbmRleCwgbG9ncywgY2FsbGJhY2spIHtcbiAgc2FmZWpzb24uc3RyaW5naWZ5KGxvZ3MsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBscy5zZXRJdGVtKGxvZ3NJbmRleCwgcmVzKTtcblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIGxvZ3MpO1xuICAgIH1cbiAgfSk7XG59XG5cblxuLyoqXG4gKiBXcml0ZSBhIGxvZyB0byBwZXJtYW5lbnQgc3RvcmFnZVxuICogQHBhcmFtIHtMb2d9XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufVxuICovXG5leHBvcnRzLndyaXRlTG9nID0gZnVuY3Rpb24gKGxvZywgY2FsbGJhY2spIHtcbiAgdXBkYXRlSW5kZXhlcyhsb2csIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICB9XG5cbiAgICB2YXIgbG9nc0luZGV4ID0gZ2VuSW5kZXgobG9nKTtcblxuICAgIGdldExvZ3NGb3JJbmRleChsb2dzSW5kZXgsIGZ1bmN0aW9uIChlcnIsIGxvZ3MpIHtcbiAgICAgIGxvZ3MucHVzaChsb2cudG9KU09OKCkpO1xuXG4gICAgICBzYXZlTG9nc0ZvckluZGV4KGxvZ3NJbmRleCwgbG9ncywgY2FsbGJhY2spO1xuICAgIH0pO1xuICB9KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBTdG9yYWdlID0gcmVxdWlyZSgnLi9TdG9yYWdlJylcbiAgLCBzYWZlanNvbiA9IHJlcXVpcmUoJ3NhZmVqc29uJyk7XG5cblxudmFyIHVwbG9hZEZuID0gbnVsbFxuICAsIHVwbG9hZEluUHJvZ3Jlc3MgPSBmYWxzZVxuICAsIHVwbG9hZFRpbWVyID0gbnVsbDtcblxuXG5mdW5jdGlvbiBkZWZhdWx0VXBsb2FkQ2FsbGJhY2soZXJyKSB7XG4gIGlmIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdsb2dnZXIgZW5jb3VudGVyZWQgYW4gZXJyb3IgdXBsb2FkaW5nIGxvZ3MnLCBlcnIpO1xuICB9XG59XG5cblxuLyoqXG4gKiBTdGFydCB0aGUgdGltZXIgdG8gdXBsb2FkIGxvZ3MgaW4gaW50ZXJ2YWxzLlxuICovXG5leHBvcnRzLnN0YXJ0SW50ZXJ2YWwgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdXBsb2FkVGltZXIpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB1cGxvYWRUaW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYudXBsb2FkKCk7XG4gICAgfSwgNjAwMDApO1xuICB9XG59O1xuXG5cbi8qKlxuICogU2V0IHRoZSBmdW5jdGlvbiB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIHVwbG9hZCBsb2dzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqL1xuZXhwb3J0cy5zZXRVcGxvYWRGbiA9IGZ1bmN0aW9uIChmbikge1xuICB1cGxvYWRGbiA9IGZuO1xufTtcblxuXG4vKipcbiAqIEdldCB0aGUgZnVuY3Rpb24gYmVpbmcgdXNlZCB0byB1cGxvYWQgbG9ncy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5leHBvcnRzLmdldFVwbG9hZEZuID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdXBsb2FkRm47XG59O1xuXG5cbi8qKlxuICogVXBsb2FkIGxvZ3MsIGFsd2F5cyB1cGxvYWRzIHRoZSBvbGRlc3QgZGF5IG9mIGxvZ3MgZmlyc3QuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufVxuICovXG5leHBvcnRzLnVwbG9hZCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAvLyBTZXQgYSBjYWxsYmFjayBmb3IgdXBsb2FkIGNvbXBsZXRlXG4gIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZGVmYXVsdFVwbG9hZENhbGxiYWNrO1xuXG4gIGlmICghdXBsb2FkRm4pIHtcbiAgICByZXR1cm4gY2FsbGJhY2soJ0NhbGxlZCB1cGxvYWQgd2l0aG91dCBzZXR0aW5nIGFuIHVwbG9hZCBmdW5jdGlvbicpO1xuICB9XG5cbiAgaWYgKCF1cGxvYWRJblByb2dyZXNzKSB7XG4gICAgY29uc29sZS5sb2coJ1VwbG9hZCBhbHJlYWR5IGluIHByb2dyZXNzLiBTa2lwcGluZyBzZWNvbmQgY2FsbC4nKTtcbiAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgbnVsbCk7XG4gIH1cblxuICAvLyBGbGFnIHRoYXQgd2UgYXJlIHVwbG9hZGluZ1xuICB1cGxvYWRJblByb2dyZXNzID0gdHJ1ZTtcblxuICBTdG9yYWdlLmdldEluZGV4ZXMoZnVuY3Rpb24gKGVyciwgaWR4cykge1xuICAgIGlmIChpZHhzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdXBsb2FkSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgLy8gT2xkZXN0IGxvZ3Mgc2hvdWxkIGJlIHVwbG9hZGVkIGZpcnN0XG4gICAgdmFyIGRhdGUgPSBpZHhzLnNvcnQoKVswXTtcblxuICAgIFN0b3JhZ2UuZ2V0TG9nc0ZvckluZGV4KGRhdGUsIGZ1bmN0aW9uIChlcnIsIGxvZ3MpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgdXBsb2FkSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgfVxuXG4gICAgICBzYWZlanNvbi5zdHJpbmdpZnkobG9ncywgZnVuY3Rpb24gKGVyciwgc3RyKSB7XG4gICAgICAgIHVwbG9hZEZuKHN0ciwgIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICB1cGxvYWRJblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgICAgY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59O1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIExFVkVMUyA9IHJlcXVpcmUoJy4uL0xldmVscycpO1xuXG4vKipcbiAqIExvZ3Mgb3V0cHV0IHVzaW5nIE5vZGUuanMgc3RkaW4vc3RkZXJyIHN0cmVhbS5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gbGV2ZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqL1xuZnVuY3Rpb24gbm9kZUxvZyAobGV2ZWwsIHN0cikge1xuICBpZiAobGV2ZWwgPT09IExFVkVMUy5FUlJPUikge1xuICAgIHByb2Nlc3Muc3RkZXJyLndyaXRlKHN0ciArICdcXG4nKTtcbiAgfSBlbHNlIHtcbiAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShzdHIgKyAnXFxuJyk7XG4gIH1cbn1cblxuXG4vKipcbiAqIExvZ3Mgb3V0cHV0IHVzaW5nIHRoZSBicm93c2VyJ3MgY29uc29sZSBvYmplY3QuXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IGxldmVsXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKi9cbmZ1bmN0aW9uIGJyb3dzZXJMb2cgKGxldmVsLCBzdHIpIHtcbiAgdmFyIGxvZ0ZuID0gY29uc29sZS5sb2c7XG5cbiAgc3dpdGNoIChsZXZlbCkge1xuICAgIGNhc2UgTEVWRUxTLkRFQlVHOlxuICAgICAgLy8gY29uc29sZS5kZWJ1ZyBpcyBub3QgYXZhaWxhYmxlIGluIE5vZGUgbGFuZFxuICAgICAgbG9nRm4gPSBjb25zb2xlLmRlYnVnIHx8IGNvbnNvbGUubG9nO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBMRVZFTFMuSU5GTzpcbiAgICAgIC8vIGNvbnNvbGUuaW5mbyBpcyBub3QgYXZhaWxhYmxlIGluIE5vZGUgbGFuZCBlaXRoZXJcbiAgICAgIGxvZ0ZuID0gY29uc29sZS5pbmZvIHx8IGNvbnNvbGUubG9nO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBMRVZFTFMuV0FSTjpcbiAgICAgIGxvZ0ZuID0gY29uc29sZS53YXJuO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBMRVZFTFMuRVJST1I6XG4gICAgICBsb2dGbiA9IGNvbnNvbGUuZXJyb3I7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIGxvZ0ZuLmNhbGwoY29uc29sZSwgc3RyKTtcbn1cblxuXG5pZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBub2RlTG9nO1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBicm93c2VyTG9nO1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIkZXYUFTSFwiKSkiLCIndXNlIHN0cmljdCc7XG5cblxuZXhwb3J0cy50cmFuc3BvcnRzID0ge1xuICAnY29uc29sZSc6IHJlcXVpcmUoJy4vY29uc29sZScpXG59O1xuXG4vLyBUcmFuc3BvcnRzIHRvIHVzZSwgZGVmYXVsdCBpbmNsdWVzIGNvbnNvbGVcbnZhciBhY3RpdmVUcmFuc3BvcnRzID0gW2V4cG9ydHMudHJhbnNwb3J0cy5jb25zb2xlXTtcblxuLyoqXG4gKiBMb2cgdGhlIHByb3ZpZGVkIGxvZyB0byB0aGUgYWN0aXZlIHRyYW5zcG9ydHMuXG4gKiBAcHVibGljXG4gKiBAcGFyYW0ge051bWJlcn0gbGV2ZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqL1xuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbiAobGV2ZWwsIHN0cikge1xuICBmb3IgKHZhciBpIGluIGFjdGl2ZVRyYW5zcG9ydHMpIHtcbiAgICBhY3RpdmVUcmFuc3BvcnRzW2ldKGxldmVsLCBzdHIpO1xuICB9XG59O1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8vIERldGVybWluZXMgd2V0aGVyIGFjdGlvbnMgc2hvdWxkIGJlIGRlZmVycmVkIGZvciBwcm9jZXNzaW5nXG5leHBvcnRzLmRlZmVyID0gZmFsc2U7XG5cblxuLyoqXG4gKiBEZWZlciBhIGZ1bmN0aW9uIGNhbGwgbW9tZW50YWlybHkuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICovXG5mdW5jdGlvbiBkZWZlcnJlZChmbikge1xuICBpZiAoZXhwb3J0cy5kZWZlciA9PT0gdHJ1ZSkge1xuICAgIHByb2Nlc3MubmV4dFRpY2soZm4pO1xuICB9IGVsc2Uge1xuICAgIGZuKCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFN0cmluZ2lmeSBKU09OIGFuZCBjYXRjaCBhbnkgcG9zc2libGUgZXhjZXB0aW9ucy5cbiAqIEBwYXJhbSB7T2JqZWN0fSAgICBqc29uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAgW3JlcGxhY2VyXVxuICogQHBhcmFtIHtOdW1iZXJ9ICAgIFtzcGFjZXNdXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAgY2FsbGJhY2tcbiAqL1xuZXhwb3J0cy5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoLypqc29uLCByZXBsYWNlciwgc3BhY2VzLCBjYWxsYmFjayovKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgICwgY2FsbGJhY2sgPSBhcmdzLnNwbGljZShhcmdzLmxlbmd0aCAtIDEsIGFyZ3MubGVuZ3RoKVswXTtcblxuICBkZWZlcnJlZChmdW5jdGlvbigpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIEpTT04uc3RyaW5naWZ5LmFwcGx5KG51bGwsIGFyZ3MpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZSwgbnVsbCk7XG4gICAgfVxuICB9KTtcbn07XG5cblxuLyoqXG4gKiBQYXJzZSBzdHJpbmcgb2YgSlNPTiBhbmQgY2F0Y2ggYW55IHBvc3NpYmxlIGV4Y2VwdGlvbnMuXG4gKiBAcGFyYW0ge1N0cmluZ30gICAganNvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gIFtyZXZpdmVyXVxuICogQHBhcmFtIHtGdW5jdGlvbn0gIGNhbGxiYWNrXG4gKi9cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoLypqc29uLCByZXZpdmVyLCBjYWxsYmFjayovKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgICwgY2FsbGJhY2sgPSBhcmdzLnNwbGljZShhcmdzLmxlbmd0aCAtIDEsIGFyZ3MubGVuZ3RoKVswXTtcblxuICBkZWZlcnJlZChmdW5jdGlvbigpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIEpTT04ucGFyc2UuYXBwbHkobnVsbCwgYXJncykpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlLCBudWxsKTtcbiAgICB9XG4gIH0pO1xufTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiRldhQVNIXCIpKSIsIm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kXG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgICB2YXIgdGFyZ2V0ID0ge31cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBmaGxvZyA9IHJlcXVpcmUoJ2ZobG9nJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICAvLyBTaW1wbHkgdXNlIGZobG9nISBNYXkgY2hhbmdlLi4uXG4gIHJldHVybiBmaGxvZztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ25nRkgnKVxuICAuZmFjdG9yeSgnTG9nJywgcmVxdWlyZSgnLi9Mb2cuanMnKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIFJlZ2lzdGVyIG5nRkggbW9kdWxlXG5tb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCduZ0ZIJywgWyduZyddKTtcblxuLy8gQmluZCBvdXIgbW9kdWxlcyB0byBuZ0ZIXG5yZXF1aXJlKCcuL2ZhY3RvcmllcycpO1xucmVxdWlyZSgnLi9zZXJ2aWNlcycpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZmggPSAkZmggLy8gT25jZSBmaC1qcy1zZGsgaXMgb24gbnBtIHdlIGNhbiByZXF1aXJlIGl0IGhlcmVcbiAgLCBwcmludExvZ3MgPSB0cnVlXG4gICwgZGVmYXVsdFRpbWVvdXQgPSAzMCAqIDEwMDA7XG5cblxuLyoqXG4gKiBTZXJ2aWNlIHRvIHJlcHJlc2VudCBGSC5BY3RcbiAqIEBtb2R1bGUgQWN0XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKFV0aWxzLCBMb2csICRxLCAkdGltZW91dCkge1xuICB2YXIgbG9nID0gTG9nLmdldExvZ2dlcignRkguQWN0Jyk7XG5cbiAgLy8gRXJyb3Igc3RyaW5ncyB1c2VkIGZvciBlcnJvciB0eXBlIGRldGVjdGlvblxuICB2YXIgQUNUX0VSUk9SUyA9IHtcbiAgICBQQVJTRV9FUlJPUjogJ3BhcnNlZXJyb3InLFxuICAgIE5PX0FDVE5BTUU6ICdhY3Rfbm9fYWN0aW9uJyxcbiAgICBVTktOT1dOX0FDVDogJ25vIHN1Y2ggZnVuY3Rpb24nLFxuICAgIElOVEVSTkFMX0VSUk9SOiAnaW50ZXJuYWwgZXJyb3IgaW4nLFxuICAgIFRJTUVPVVQ6ICd0aW1lb3V0J1xuICB9O1xuXG4gIC8qKlxuICAgKiBFeHBvc2VkIGVycm9yIHR5cGVzIGZvciBjaGVja3MgYnkgZGV2ZWxvcGVycy5cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdmFyIEVSUk9SUyA9IHRoaXMuRVJST1JTID0ge1xuICAgIE5PX0FDVE5BTUVfUFJPVklERUQ6ICdOT19BQ1ROQU1FX1BST1ZJREVEJyxcbiAgICBVTktOT1dOX0VSUk9SOiAnVU5LTk9XTl9FUlJPUicsXG4gICAgVU5LTk9XTl9BQ1Q6ICdVTktOT1dOX0FDVCcsXG4gICAgQ0xPVURfRVJST1I6ICdDTE9VRF9FUlJPUicsXG4gICAgVElNRU9VVDogJ1RJTUVPVVQnLFxuICAgIFBBUlNFX0VSUk9SOiAnUEFSU0VfRVJST1InLFxuICAgIE5PX05FVFdPUks6ICdOT19ORVRXT1JLJ1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIENhbGxlZCBvbiBhIHN1Y2Nlc3NmdWwgYWN0IGNhbGwgKHdoZW4gbWFpbi5qcyBjYWxsYmFjayBpcyBjYWxsZWQgd2l0aCBhXG4gICAqIG51bGwgZXJyb3IgcGFyYW0pXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICAgICAgYWN0bmFtZVxuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgICAgIHJlc1xuICAgKiBAcGFyYW0gICB7RnVuY3Rpb259ICAgIGNhbGxiYWNrXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICBmdW5jdGlvbiBwYXJzZVN1Y2Nlc3MoYWN0bmFtZSwgcmVzKSB7XG4gICAgbG9nLmRlYnVnKCdDYWxsZWQgXCInICsgYWN0bmFtZSArICdcIiBzdWNjZXNzZnVsbHkuJyk7XG5cbiAgICByZXR1cm4gcmVzO1xuICB9XG5cblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gYW4gYWN0IGNhbGwgaGFzIGZhaWxlZC4gQ3JlYXRlcyBhIG1lYW5pbmdmdWwgZXJyb3Igc3RyaW5nLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgICAgIGFjdG5hbWVcbiAgICogQHBhcmFtICAge1N0cmluZ30gICAgICBlcnJcbiAgICogQHBhcmFtICAge09iamVjdH0gICAgICBkZXRhaWxzXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICBmdW5jdGlvbiBwYXJzZUZhaWwoYWN0bmFtZSwgZXJyLCBkZXRhaWxzKSB7XG4gICAgdmFyIEVSUiA9IG51bGw7XG5cbiAgICBpZiAoZXJyID09PSBBQ1RfRVJST1JTLk5PX0FDVE5BTUUpIHtcbiAgICAgIEVSUiA9IEVSUk9SUy5OT19BQ1ROQU1FX1BST1ZJREVEO1xuICAgIH0gZWxzZSBpZiAoZXJyICE9PSAnZXJyb3JfYWpheGZhaWwnKSB7XG4gICAgICBFUlIgPSBFUlJPUlMuVU5LTk9XTl9FUlJPUjtcbiAgICB9IGVsc2UgaWYgKGVyciA9PT0gRVJST1JTLk5PX0FDVE5BTUVfUFJPVklERUQpIHtcbiAgICAgIEVSUiA9IEVSUk9SUy5OT19BQ1ROQU1FX1BST1ZJREVEO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBkZXRhaWxzLmVycm9yLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihBQ1RfRVJST1JTLlVOS05PV05fQUNUKSA+PSAwKSB7XG4gICAgICBFUlIgPSBFUlJPUlMuVU5LTk9XTl9BQ1Q7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIGRldGFpbHMubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoQUNUX0VSUk9SUy5USU1FT1VUKSA+PSAwKSB7XG4gICAgICBFUlIgPSBFUlJPUlMuVElNRU9VVDtcbiAgICB9IGVsc2UgaWYgKGRldGFpbHMubWVzc2FnZSA9PT0gQUNUX0VSUk9SUy5QQVJTRV9FUlJPUikge1xuICAgICAgRVJSID0gRVJST1JTLlBBUlNFX0VSUk9SO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDbG91ZCBjb2RlIHNlbnQgZXJyb3IgdG8gaXQncyBjYWxsYmFja1xuICAgICAgbG9nLmRlYnVnKCdcIiVzXCIgZW5jb3VudGVyZWQgYW4gZXJyb3IgaW4gaXRcXCdzIGNsb3VkIGNvZGUuIEVycm9yICcgK1xuICAgICAgICAnU3RyaW5nOiAlcywgRXJyb3IgT2JqZWN0OiAlbycsIGFjdG5hbWUsIGVyciwgZGV0YWlscyk7XG4gICAgICBFUlIgPSBFUlJPUlMuQ0xPVURfRVJST1I7XG4gICAgfVxuXG4gICAgbG9nLmRlYnVnKCdcIiVzXCIgZmFpbGVkIHdpdGggZXJyb3IgJXMnLCBhY3RuYW1lLCBFUlIpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IEVSUixcbiAgICAgIGVycjogZXJyLFxuICAgICAgbXNnOiBkZXRhaWxzXG4gICAgfTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIENhbGwgYW4gYWN0aW9uIG9uIHRoZSBjbG91ZC5cbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgICAgIG9wdHNcbiAgICogQHBhcmFtICAge0Z1bmN0aW9ufSAgICBbY2FsbGJhY2tdXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfG51bGx9XG4gICAqL1xuICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKVxuICAgICAgLCBzdWNjZXNzXG4gICAgICAsIGZhaWw7XG5cbiAgICAvLyBEZWZlciBjYWxsIHNvIHdlIGNhbiByZXR1cm4gcHJvbWlzZSBmaXJzdFxuICAgIGlmIChVdGlscy5pc09ubGluZSgpKSB7XG4gICAgICBsb2cuZGVidWcoJ01ha2luZyBjYWxsIHdpdGggb3B0cyAlaicsIG9wdHMpO1xuXG4gICAgICBzdWNjZXNzID0gVXRpbHMuc2FmZUNhbGxiYWNrKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwYXJzZVN1Y2Nlc3Mob3B0cy5hY3QsIHJlcykpO1xuICAgICAgfSk7XG5cbiAgICAgIGZhaWwgPSBVdGlscy5zYWZlQ2FsbGJhY2soZnVuY3Rpb24gKGVyciwgbXNnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChwYXJzZUZhaWwob3B0cy5hY3QsIGVyciwgbXNnKSk7XG4gICAgICB9KTtcblxuICAgICAgZmguYWN0KG9wdHMsIHN1Y2Nlc3MsIGZhaWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2cuZGVidWcoJ0NhblxcJ3QgbWFrZSBhY3QgY2FsbCwgbm8gbmV0b3dyay4gT3B0czogJWonLCBvcHRzKTtcblxuICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3Qoe1xuICAgICAgICAgIHR5cGU6IEVSUk9SUy5OT19ORVRXT1JLLFxuICAgICAgICAgIGVycjogbnVsbCxcbiAgICAgICAgICBtc2c6IG51bGxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRlZmF1bHQgdGltZW91dCBmb3IgQWN0IGNhbGxzIGluIG1pbGxpc2Vjb25kc1xuICAgKiBAcHVibGljXG4gICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLmdldERlZmF1bHRUaW1lb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBkZWZhdWx0VGltZW91dDtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGRlZmF1bHQgdGltZW91dCBmb3IgQWN0IGNhbGxzIGluIG1pbGxpc2Vjb25kc1xuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB0IFRoZSB0aW1lb3V0LCBpbiBtaWxsaXNlY29uZHMsIHRvIHVzZVxuICAgKi9cbiAgdGhpcy5zZXREZWZhdWx0VGltZW91dCA9IGZ1bmN0aW9uKHQpIHtcbiAgICBkZWZhdWx0VGltZW91dCA9IHQ7XG4gIH07XG5cblxuICAvKipcbiAgICogRGlzYmFsZSBkZWJ1Z2dpbmcgbG9nZ2luZyBieSB0aGlzIHNlcnZpY2VcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdGhpcy5kaXNhYmxlTG9nZ2luZyA9IGZ1bmN0aW9uKCkge1xuICAgIGxvZy5zZXRTaWxlbnQodHJ1ZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEVuYWJsZSBkZWJ1ZyBsb2dnaW5nIGJ5IHRoaXMgc2VydmljZVxuICAgKiBAcHVibGljXG4gICAqL1xuICB0aGlzLmVuYWJsZUxvZ2dpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBsb2cuc2V0U2lsZW50KGZhbHNlKTtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kJylcbiAgLCBmaCA9ICRmaCAvLyBPbmNlIGZoLWpzLXNkayBpcyBvbiBucG0gd2UgY2FuIHJlcXVpcmUgaXQgaGVyZVxuICAsIHByaW50TG9ncyA9IHRydWVcbiAgLCB0aW1lb3V0ID0gMzAgKiAxMDAwO1xuXG52YXIgREVGQVVMVF9PUFRTID0ge1xuICB0eXBlOiAnR0VUJyxcbiAgcGF0aDogJy9jbG91ZC8nLFxuICB0aW1lb3V0OiB0aW1lb3V0LFxuICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICBkYXRhOiB7fVxufTtcblxuLyoqXG4gKiBTZXJ2aWNlIHRvIHJlcHJlc2VudCBGSC5DbG91ZFxuICogQG1vZHVsZSBDbG91ZFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChVdGlscywgTG9nLCAkcSwgJHRpbWVvdXQpIHtcbiAgdmFyIGxvZyA9IExvZy5nZXRMb2dnZXIoJ0ZILkNsb3VkJyk7XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gdGhlIGNsb3VkIHJlcXVlc3QgcmV0dXJuaW5nIGEgcHJvbWlzZSBvciBudWxsLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgICBvcHRzXG4gICAqIEBwYXJhbSAgIHtGdW5jdGlvbn0gIFtjYWxsYmFja11cbiAgICogQHJldHVybnMge1Byb21pc2V8bnVsbH1cbiAgICovXG4gIGZ1bmN0aW9uIGNsb3VkUmVxdWVzdCAob3B0cywgY2FsbGJhY2spIHtcbiAgICB2YXIgcHJvbWlzZSA9IG51bGw7XG5cbiAgICAvLyBEZWZpbmUgYWxsIG9wdGlvbnNcbiAgICBvcHRzID0geHRlbmQoREVGQVVMVF9PUFRTLCBvcHRzKTtcblxuICAgIC8vIFdlIG5lZWQgdG8gdXNlIHByb21pc2VzIGFzIHVzZXIgZGlkbid0IHByb3ZpZGUgYSBjYWxsYmFja1xuICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgIHByb21pc2UgPSAkcS5kZWZlcigpO1xuXG4gICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9taXNlLnJlc29sdmUocmVzKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBEZWZlciBjYWxsIHNvIHdlIGNhbiByZXR1cm4gcHJvbWlzZVxuICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGxvZy5kZWJ1ZygnQ2FsbCB3aXRoIG9wdGlvbnM6ICVqJywgb3B0cyk7XG5cbiAgICAgIGZoLmNsb3VkKG9wdHMsIFV0aWxzLm9uU3VjY2VzcyhjYWxsYmFjayksIFV0aWxzLm9uRmFpbChjYWxsYmFjaykpO1xuICAgIH0sIDApO1xuXG4gICAgLy8gUmV0cnVuIHByb21pc2Ugb3IgbnVsbFxuICAgIHJldHVybiAocHJvbWlzZSAhPT0gbnVsbCkgPyBwcm9taXNlLnByb21pc2UgOiBudWxsO1xuICB9XG5cblxuICAvKipcbiAgICogVXRpbGl0eSBmbiB0byBzYXZlIGNvZGUgZHVwbGljYXRpb25cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtICAge1N0cmluZ30gdmVyYlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAqL1xuICBmdW5jdGlvbiBfZ2VuVmVyYkZ1bmMgKHZlcmIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHBhdGgsIGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gY2xvdWRSZXF1ZXN0KHtcbiAgICAgICAgcGF0aDogcGF0aCxcbiAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgdHlwZTogdmVyYi50b1VwcGVyQ2FzZSgpXG4gICAgICB9LCBjYWxsYmFjayk7XG4gICAgfTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIFNob3J0aGFuZCBtZXRob2QgZm9yIEdFVCByZXF1ZXN0LlxuICAgKiBAcHVibGljXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgcGF0aFxuICAgKiBAcGFyYW0gICB7TWl4ZWR9ICAgZGF0YVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZXxudWxsfVxuICAgKi9cbiAgdGhpcy5nZXQgICAgICAgICAgPSBfZ2VuVmVyYkZ1bmMoJ0dFVCcpO1xuXG5cbiAgLyoqXG4gICAqIFNob3J0aGFuZCBtZXRob2QgZm9yIFBVVCByZXF1ZXN0LlxuICAgKiBAcHVibGljXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgcGF0aFxuICAgKiBAcGFyYW0gICB7TWl4ZWR9ICAgZGF0YVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZXxudWxsfVxuICAgKi9cbiAgdGhpcy5wdXQgICAgICAgICAgPSBfZ2VuVmVyYkZ1bmMoJ1BVVCcpO1xuXG5cbiAgLyoqXG4gICAqIFNob3J0aGFuZCBtZXRob2QgZm9yIFBPU1QgcmVxdWVzdC5cbiAgICogQHB1YmxpY1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtICAge1N0cmluZ30gIHBhdGhcbiAgICogQHBhcmFtICAge01peGVkfSAgIGRhdGFcbiAgICogQHJldHVybnMge1Byb21pc2V8bnVsbH1cbiAgICovXG4gIHRoaXMucG9zdCAgICAgICAgID0gX2dlblZlcmJGdW5jKCdQT1NUJyk7XG5cblxuICAvKipcbiAgICogU2hvcnRoYW5kIG1ldGhvZCBmb3IgSEVBRCByZXF1ZXN0LlxuICAgKiBAcHVibGljXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgcGF0aFxuICAgKiBAcGFyYW0gICB7TWl4ZWR9ICAgZGF0YVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZXxudWxsfVxuICAgKi9cbiAgdGhpcy5oZWFkICAgICAgICAgPSBfZ2VuVmVyYkZ1bmMoJ0hFQUQnKTtcblxuXG4gIC8qKlxuICAgKiBTaG9ydGhhbmQgbWV0aG9kIGZvciBERUxFVEUgcmVxdWVzdC5cbiAgICogQHB1YmxpY1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtICAge1N0cmluZ30gIHBhdGhcbiAgICogQHBhcmFtICAge01peGVkfSAgIGRhdGFcbiAgICogQHJldHVybnMge1Byb21pc2V8bnVsbH1cbiAgICovXG4gIHRoaXNbJ2RlbGV0ZSddICAgID0gX2dlblZlcmJGdW5jKCdERUxFVEUnKTtcblxuXG5cblxuICAvKipcbiAgICogTWFudWFsbHkgcHJvdmlkZSBIVFRQIHZlcmIgYW5kIGFsbCBvcHRpb25zIGFzIHBlciBTREsgZG9jcy5cbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgICBvcHRzICAgICAgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgcmVxdWVzdFxuICAgKiBAcGFyYW0gICB7RnVuY3Rpb259ICBjYWxsYmFjayAgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICogQHJldHVybnMge1Byb21pc2V8bnVsbH1cbiAgICovXG4gIHRoaXMucmVxdWVzdCA9IGZ1bmN0aW9uIChvcHRzLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBjbG91ZFJlcXVlc3Qob3B0cywgY2FsbGJhY2spO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZGVmYXVsdCB0aW1lb3V0IGZvciBDbG91ZCBjYWxscyBpbiBtaWxsaXNlY29uZHNcbiAgICogQHB1YmxpY1xuICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5nZXREZWZhdWx0VGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGltZW91dDtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGRlZmF1bHQgdGltZW91dCBmb3IgQ2xvdWQgY2FsbHMgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHQgTmV3IHRpbWVvdXQgdmFsdWUgaW4gbWlsbGlzZWNvbmRzXG4gICAqL1xuICB0aGlzLnNldERlZmF1bHRUaW1lb3V0ID0gZnVuY3Rpb24odCkge1xuICAgIHRpbWVvdXQgPSB0O1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIERpc2JhbGUgZGVidWdnaW5nIGxvZ2dpbmcgYnkgdGhpcyBzZXJ2aWNlXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHRoaXMuZGlzYWJsZUxvZ2dpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBwcmludExvZ3MgPSBmYWxzZTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBFbmFibGUgZGVidWcgbG9nZ2luZyBieSB0aGlzIHNlcnZpY2VcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdGhpcy5lbmFibGVMb2dnaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcHJpbnRMb2dzID0gdHJ1ZTtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCRyb290U2NvcGUsICR3aW5kb3cpIHtcblxuICAvKipcbiAgICogU2FmZWx5IGNhbGwgYSBmdW5jdGlvbiB0aGF0IG1vZGlmaWVzIHZhcmlhYmxlcyBvbiBhIHNjb3BlLlxuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqL1xuICB2YXIgc2FmZUFwcGx5ID0gdGhpcy5zYWZlQXBwbHkgPSBmdW5jdGlvbiAoZm4sIGFyZ3MpIHtcbiAgICB2YXIgcGhhc2UgPSAkcm9vdFNjb3BlLiQkcGhhc2U7XG5cbiAgICBpZiAocGhhc2UgPT09ICckYXBwbHknIHx8IHBoYXNlID09PSAnJGRpZ2VzdCcpIHtcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgIGZuLmFwcGx5KGZuLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmbi5hcHBseShmbiwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZm4pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBXcmFwIGEgY2FsbGJhY2sgZm9yIHNhZmUgZXhlY3V0aW9uLlxuICAgKiBJZiB0aGUgY2FsbGJhY2sgZG9lcyBmdXJ0aGVyIGFzeW5jIHdvcmsgdGhlbiB0aGlzIG1heSBub3Qgd29yay5cbiAgICogQHBhcmFtICAge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAqL1xuICB0aGlzLnNhZmVDYWxsYmFjayA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICAgIHNhZmVBcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KGNhbGxiYWNrLCBhcmdzKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH07XG5cblxuICAvKipcbiAgICogQ2hlY2sgZm9yIGFuIGludGVybmV0IGNvbm5lY3Rpb24uXG4gICAqIEBwdWJsaWNcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmlzT25saW5lID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAkd2luZG93Lm5hdmlnYXRvci5vbkxpbmU7XG4gIH07XG5cblxuICAvKipcbiAgICogV3JhcCBhIHN1Y2Nlc3MgY2FsbGJhY2sgaW4gTm9kZS5qcyBzdHlsZS5cbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0gICB7RnVuY3Rpb259XG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgdGhpcy5vblN1Y2Nlc3MgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHJlcykge1xuICAgICAgc2FmZUFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm4gKG51bGwsIHJlcyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIFdyYXAgYSBmYWlsIGNhbGxiYWNrIGluIE5vZGUuanMgc3R5bGUuXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtICAge0Z1bmN0aW9ufVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIHRoaXMub25GYWlsID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHNhZmVBcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZuIChlcnIsIG51bGwpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfTtcblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyLm1vZHVsZSgnbmdGSCcpXG4gIC5zZXJ2aWNlKCdVdGlscycsIHJlcXVpcmUoJy4vVXRpbHMuanMnKSlcbiAgLnNlcnZpY2UoJ0Nsb3VkJywgcmVxdWlyZSgnLi9DbG91ZC5qcycpKVxuICAuc2VydmljZSgnQWN0JywgcmVxdWlyZSgnLi9BY3QuanMnKSk7XG4iXX0=
