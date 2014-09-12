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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL2xpYi9MZXZlbHMuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL2xpYi9Mb2cuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL2xpYi9Mb2dnZXIuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL2xpYi9Mb2dnZXJGYWN0b3J5LmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L25vZGVfbW9kdWxlcy9maGxvZy9saWIvU3RvcmFnZS5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9ub2RlX21vZHVsZXMvZmhsb2cvbGliL1VwbG9hZGVyLmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L25vZGVfbW9kdWxlcy9maGxvZy9saWIvdHJhbnNwb3J0L2NvbnNvbGUuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL2xpYi90cmFuc3BvcnQvaW5kZXguanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL2ZobG9nL25vZGVfbW9kdWxlcy9zYWZlanNvbi9zcmMvaW5kZXguanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvbm9kZV9tb2R1bGVzL3h0ZW5kL2ltbXV0YWJsZS5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9zcmMvZmFjdG9yaWVzL0xvZy5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9zcmMvZmFjdG9yaWVzL2luZGV4LmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L3NyYy9uZ0ZILmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L3NyYy9zZXJ2aWNlcy9BY3QuanMiLCIvVXNlcnMvZXNob3J0aXNzL3dvcmtzcGFjZXMvcGVyc29uYWwvbmdGZWVkSGVucnkvc3JjL3NlcnZpY2VzL0Nsb3VkLmpzIiwiL1VzZXJzL2VzaG9ydGlzcy93b3Jrc3BhY2VzL3BlcnNvbmFsL25nRmVlZEhlbnJ5L3NyYy9zZXJ2aWNlcy9VdGlscy5qcyIsIi9Vc2Vycy9lc2hvcnRpc3Mvd29ya3NwYWNlcy9wZXJzb25hbC9uZ0ZlZWRIZW5yeS9zcmMvc2VydmljZXMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJGV2FBU0hcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICdERUJVRyc6IDAsXG4gICdJTkZPJzogMSxcbiAgJ1dBUk4nOiAyLFxuICAnRVJST1InOiAzXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKVxuICAsIHRyYW5zcG9ydCA9IHJlcXVpcmUoJy4vdHJhbnNwb3J0JylcbiAgLCBMRVZFTFMgPSByZXF1aXJlKCcuL0xldmVscycpO1xuXG4vKipcbiAqIEBwdWJsaWNcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqL1xuZnVuY3Rpb24gTG9nKGxldmVsLCBuYW1lLCBhcmdzKSB7XG4gIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzKTtcblxuICB2YXIgdHMgPSBEYXRlLm5vdygpXG4gICAgLCBsdmxTdHIgPSAnJ1xuICAgICwgcHJlZml4ID0gJyc7XG5cbiAgc3dpdGNoIChsZXZlbCkge1xuICAgIGNhc2UgTEVWRUxTLkRFQlVHOlxuICAgICAgbHZsU3RyID0gJ0RFQlVHJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgTEVWRUxTLklORk86XG4gICAgICBsdmxTdHIgPSAnSU5GTyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIExFVkVMUy5XQVJOOlxuICAgICAgbHZsU3RyID0gJ1dBUk4nO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBMRVZFTFMuRVJST1I6XG4gICAgICBsdmxTdHIgPSAnRVJST1InO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICAvLyBCdWlsZCBsb2cgcHJlZml4XG4gIHByZWZpeCA9IHV0aWwuZm9ybWF0KCclcyAlcyAlczogJywgbmV3IERhdGUodHMpLnRvSlNPTigpLCBsdmxTdHIsIG5hbWUpO1xuXG4gIC8vIE5vcm1hbGlzZSBmaXJzdCBhcmcgdG8gYSBpbmNsdWRlIG91ciBzdHJpbmcgaWYgbmVjZXNzYXJ5XG4gIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ3N0cmluZycpIHtcbiAgICBhcmdzWzBdID0gcHJlZml4ICsgYXJnc1swXTtcbiAgfVxuXG4gIC8vIEZvcm1hdCB0aGUgc3RyaW5nIHNvIHdlIGNhbiBzYXZlIGl0IGFuZCBvdXRwdXQgaXQgY29ycmVjdGx5XG4gIHRoaXMudGV4dCA9IHV0aWwuZm9ybWF0LmFwcGx5KHV0aWwsIGFyZ3MpO1xuICB0aGlzLnRzID0gdHM7XG4gIHRoaXMubGV2ZWwgPSBsZXZlbDtcbiAgdGhpcy5uYW1lID0gbmFtZTtcbn1cbm1vZHVsZS5leHBvcnRzID0gTG9nO1xuXG5cbi8qKlxuICogV3JpdGUgdGhlIGNvbnRlbnRzIG9mIHRoaXMgbG9nIHRvIG91dHB1dCB0cmFuc3BvcnRcbiAqIEBwYXJhbSAgIHtCb29sZWFufSBzaWxlbnRcbiAqIEByZXR1cm4gIHtTdHJpbmd9XG4gKi9cbkxvZy5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbiAocHJpbnQpIHtcbiAgaWYgKHByaW50KSB7XG4gICAgdHJhbnNwb3J0LmxvZyh0aGlzLmxldmVsLCB0aGlzLnRleHQpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMudGV4dDtcbn07XG5cblxuLyoqXG4gKiBHZXQgdGhlIGRhdGUgdGhhdCB0aGlzIGxvZyB3YXMgY3JlYXRlZC5cbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuTG9nLnByb3RvdHlwZS5nZXREYXRlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IERhdGUodGhpcy50cykudG9KU09OKCkuc3Vic3RyKDAsIDEwKTtcbn07XG5cblxuLyoqXG4gKiBSZXR1cm4gYSBKU09OIG9iamVjdCByZXByZXNlbnRpbmcgdGhpcyBsb2cuXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbkxvZy5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHRzOiB0aGlzLnRzLFxuICAgIHRleHQ6IHRoaXMudGV4dCxcbiAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgbGV2ZWw6IHRoaXMubGV2ZWxcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBMb2cgPSByZXF1aXJlKCcuL0xvZycpXG4gICwgU3RvcmFnZSA9IHJlcXVpcmUoJy4vU3RvcmFnZScpXG4gICwgTEVWRUxTID0gcmVxdWlyZSgnLi9MZXZlbHMnKTtcblxuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogV3JhcHBlciBmb3IgdGhlIGNvbnNvbGUgb2JqZWN0LlxuICogU2hvdWxkIGJlaGF2ZSB0aGUgc2FtZSBhcyBjb25zb2xlLk1FVEhPRFxuICogQHBhcmFtIHtTdHJpbmd9ICAgIFtuYW1lXSAgICBOYW1lIG9mIHRoaXMgbG9nZ2VyIHRvIGluY2x1ZGUgaW4gbG9ncy5cbiAqIEBwYXJhbSB7TnVtYmVyfSAgICBbbGV2ZWxdICAgTGV2ZWwgdG8gdXNlIGZvciBjYWxscyB0byAubG9nXG4gKiBAcGFyYW0ge0Jvb2xlYW59ICAgW3VwbG9hZF0gIERldGVybWluZXMgaWYgbG9ncyBhcmUgdXBsb2FkZWQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59ICAgW3NpbGVudF0gIEZsYWcgaW5kaWNhdGluZyBpZiB3ZSBwcmludCB0byBzdGRvdXQgb3Igbm90LlxuICovXG5mdW5jdGlvbiBMb2dnZXIgKG5hbWUsIGxldmVsLCB1cGxvYWQsIHNpbGVudCkge1xuICB0aGlzLl9sb2dMZXZlbCA9IGxldmVsIHx8IHRoaXMuTEVWRUxTLkRFQlVHO1xuICB0aGlzLl9uYW1lID0gbmFtZSB8fCAnJztcbiAgdGhpcy5fdXBsb2FkID0gdXBsb2FkIHx8IGZhbHNlO1xuICB0aGlzLl9zaWxlbnQgPSBzaWxlbnQgfHwgZmFsc2U7XG59XG5tb2R1bGUuZXhwb3J0cyA9IExvZ2dlcjtcblxuTG9nZ2VyLnByb3RvdHlwZS5MRVZFTFMgPSBMRVZFTFM7XG5Mb2dnZXIuTEVWRUxTID0gTEVWRUxTO1xuXG5cbi8qKlxuICogQHByaXZhdGVcbiAqIExvZyBvdXRwdXQgdG8gc3Rkb3V0IHdpdGggZm9ybWF0OiBcIjIwMTQtMDYtMjZUMTY6NDI6MTEuMTM5WiBMb2dnZXJOYW1lOlwiXG4gKiBAcGFyYW0gICB7TnVtYmVyfSAgbGV2ZWxcbiAqIEBwYXJhbSAgIHtBcnJheX0gICBhcmdzXG4gKiBAcmV0dXJuICB7U3RyaW5nfVxuICovXG5Mb2dnZXIucHJvdG90eXBlLl9sb2cgPSBmdW5jdGlvbihsZXZlbCwgYXJncykge1xuICB2YXIgbCA9IG5ldyBMb2cobGV2ZWwsIHRoaXMuZ2V0TmFtZSgpLCBhcmdzKTtcblxuICBpZiAodGhpcy5fdXBsb2FkKSB7XG4gICAgU3RvcmFnZS53cml0ZUxvZyhsKTtcbiAgfVxuXG4gIHJldHVybiBsLnByaW50KCF0aGlzLmlzU2lsZW50KCkpO1xufTtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIFRvZ2dsZSBwcmludGluZyBvdXQgbG9ncyB0byBzdGRvdXQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHNpbGVudFxuICovXG5Mb2dnZXIucHJvdG90eXBlLnNldFNpbGVudCA9IGZ1bmN0aW9uIChzaWxlbnQpIHtcbiAgdGhpcy5fc2lsZW50ID0gc2lsZW50IHx8IGZhbHNlO1xufTtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIERldGVybWluZSBpZiB0aGlzIGxvZ2dlciBpcyBwcmludGluZyB0byBzdGRvdXQuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5pc1NpbGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX3NpbGVudDtcbn07XG5cblxuLyoqXG4gKiBAcHVibGljXG4gKiBMb2cgYSBtZXNzYWdlIGEgY3VycmVudCBsb2cgbGV2ZWxcbiAqIExvZyBhIHN0cmluZyBhbmQgcmV0dXJuIHRoZSBzdHJpbmcgdmFsdWUgb2YgdGhlIHByb3ZpZGVkIGxvZyBhcmdzLlxuICogVGhpcyBvcGVyYXRlcyBpbiB0aGUgc2FtZSBtYW5uZXIgYXMgY29uc29sZS5cbiAqIEBwYXJhbSBbYXJndW1lbnRzXSBhcmd1bWVudHMgVGhlIGxpc3Qgb2YgYXJncyB0byBsb2cuXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5Mb2dnZXIucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX2xvZyh0aGlzLmdldExvZ0xldmVsKCksIGFyZ3VtZW50cyk7XG59O1xuXG5cbi8qKlxuICogQHB1YmxpY1xuICogTG9nIGEgbWVzc2FnZSBhdCAnREVCVUcnIGxldmVsXG4gKiBMb2cgYSBzdHJpbmcgYW5kIHJldHVybiB0aGUgc3RyaW5nIHZhbHVlIG9mIHRoZSBwcm92aWRlZCBsb2cgYXJncy5cbiAqIFRoaXMgb3BlcmF0ZXMgaW4gdGhlIHNhbWUgbWFubmVyIGFzIGNvbnNvbGUuZGVidWdcbiAqIEBwYXJhbSBbYXJndW1lbnRzXSBhcmd1bWVudHMgVGhlIGxpc3Qgb2YgYXJncyB0byBsb2cuXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5Mb2dnZXIucHJvdG90eXBlLmRlYnVnID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5fbG9nKExFVkVMUy5ERUJVRywgYXJndW1lbnRzKTtcbn07XG5cblxuLyoqXG4gKiBAcHVibGljXG4gKiBMb2cgYSBtZXNzYWdlIGF0ICdJTkZPJyBsZXZlbFxuICogTG9nIGEgc3RyaW5nIGFuZCByZXR1cm4gdGhlIHN0cmluZyB2YWx1ZSBvZiB0aGUgcHJvdmlkZWQgbG9nIGFyZ3MuXG4gKiBUaGlzIG9wZXJhdGVzIGluIHRoZSBzYW1lIG1hbm5lciBhcyBjb25zb2xlLmluZm9cbiAqIEBwYXJhbSBbYXJndW1lbnRzXSBhcmd1bWVudHMgVGhlIGxpc3Qgb2YgYXJncyB0byBsb2cuXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5Mb2dnZXIucHJvdG90eXBlLmluZm8gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLl9sb2coTEVWRUxTLklORk8sIGFyZ3VtZW50cyk7XG59O1xuXG5cbi8qKlxuICogQHB1YmxpY1xuICogTG9nIGEgbWVzc2FnZSBhdCAnV0FSTicgbGV2ZWxcbiAqIExvZyBhIHN0cmluZyBhbmQgcmV0dXJuIHRoZSBzdHJpbmcgdmFsdWUgb2YgdGhlIHByb3ZpZGVkIGxvZyBhcmdzLlxuICogVGhpcyBvcGVyYXRlcyBpbiB0aGUgc2FtZSBtYW5uZXIgYXMgY29uc29sZS53YXJuXG4gKiBAcGFyYW0gW2FyZ3VtZW50c10gYXJndW1lbnRzIFRoZSBsaXN0IG9mIGFyZ3MgdG8gbG9nLlxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS53YXJuID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5fbG9nKExFVkVMUy5XQVJOLCBhcmd1bWVudHMpO1xufTtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIExvZyBhIG1lc3NhZ2UgYXQgJ0VSUk9SJyBsZXZlbFxuICogTG9nIGEgc3RyaW5nIGFuZCByZXR1cm4gdGhlIHN0cmluZyB2YWx1ZSBvZiB0aGUgcHJvdmlkZWQgbG9nIGFyZ3MuXG4gKiBUaGlzIG9wZXJhdGVzIGluIHRoZSBzYW1lIG1hbm5lciBhcyBjb25zb2xlLmVycm9yXG4gKiBAcGFyYW0gW2FyZ3VtZW50c10gYXJndW1lbnRzIFRoZSBsaXN0IG9mIGFyZ3MgdG8gbG9nLlxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5lcnIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLl9sb2coTEVWRUxTLkVSUk9SLCBhcmd1bWVudHMpO1xufTtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIExvZyBhIG1lc3NhZ2UgYXQgJ0VSUk9SJyBsZXZlbFxuICogTG9nIGEgc3RyaW5nIGFuZCByZXR1cm4gdGhlIHN0cmluZyB2YWx1ZSBvZiB0aGUgcHJvdmlkZWQgbG9nIGFyZ3MuXG4gKiBUaGlzIG9wZXJhdGVzIGluIHRoZSBzYW1lIG1hbm5lciBhcyBjb25zb2xlLmVycm9yXG4gKiBAcGFyYW0gW2FyZ3VtZW50c10gYXJndW1lbnRzIFRoZSBsaXN0IG9mIGFyZ3MgdG8gbG9nLlxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5lcnJvciA9IExvZ2dlci5wcm90b3R5cGUuZXJyO1xuXG5cbi8qKlxuICogQHB1YmxpY1xuICogU2V0IHRoZSBsZXZlbCBvZiB0aGlzIGxvZ2dlciBmb3IgY2FsbHMgdG8gdGhlIC5sb2cgaW5zdGFuY2UgbWV0aG9kLlxuICogQHBhcmFtIHtOdW1iZXJ9IGx2bFxuICovXG5Mb2dnZXIucHJvdG90eXBlLnNldExvZ0xldmVsID0gZnVuY3Rpb24gKGx2bCkge1xuICB0aGlzLl9sb2dMZXZlbCA9IGx2bDtcbn07XG5cblxuLyoqXG4gKiBAcHVibGljXG4gKiBHZXQgdGhlIGxldmVsIG9mIHRoaXMgbG9nZ2VyIHVzZWQgYnkgY2FsbHMgdG8gdGhlIC5sb2cgaW5zdGFuY2UgbWV0aG9kLlxuICogQHJldHVybnMge051bWJlcn1cbiAqL1xuTG9nZ2VyLnByb3RvdHlwZS5nZXRMb2dMZXZlbCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX2xvZ0xldmVsO1xufTtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIEdldCB0aGUgbmFtZSBvZiB0aGlzIGxvZ2dlci5cbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbkxvZ2dlci5wcm90b3R5cGUuZ2V0TmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX25hbWU7XG59O1xuXG5cbi8qKlxuICogQHB1YmxpY1xuICogU2V0IHRoZSBuYW1lIG9mIHRoaXMgbG9nZ2VyLiBJdCB3b3VsZCBiZSB2ZXJ5IHVudXN1YWwgdG8gdXNlIHRoaXMuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICovXG5Mb2dnZXIucHJvdG90eXBlLnNldE5hbWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHRoaXMuX25hbWUgPSBuYW1lO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIExvZ2dlciA9IHJlcXVpcmUoJy4vTG9nZ2VyJylcbiAgLCBVcGxvYWRlciA9IHJlcXVpcmUoJy4vVXBsb2FkZXInKVxuICAsIExFVkVMUyA9IHJlcXVpcmUoJy4vTGV2ZWxzJyk7XG5cblxuLy8gTWFwIG9mIGxvZ2dlcnMgY3JlYXRlZC4gU2FtZSBuYW1lIGxvZ2dlcnMgZXhpc3Qgb25seSBvbmNlLlxudmFyIGxvZ2dlcnMgPSB7fTtcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwcml2YXRlXG4gKiBVc2VkIHRvIGNyZWF0ZSBpbnN0YW5jZXNcbiAqL1xuZnVuY3Rpb24gTG9nZ2VyRmFjdG9yeSAoKSB7XG4gIHRoaXMuTEVWRUxTID0gTEVWRUxTO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBMb2dnZXJGYWN0b3J5KCk7XG5cbi8qKlxuICogQHB1YmxpY1xuICogR2V0IGEgbmFtZWQgbG9nZ2VyIGluc3RhbmNlIGNyZWF0aW5nIGl0IGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqIEBwYXJhbSAgIHtTdHJpbmd9ICAgIFtuYW1lXVxuICogQHBhcmFtICAge051bWJlcn0gICAgW2xldmVsXVxuICogQHBhcmFtICAge0Jvb2xlYW59ICAgW3VwbG9hZF1cbiAqIEBwYXJhbSAgIHtCb29sZWFufSAgIFtzaWxlbnRdXG4gKiBAcmV0dXJucyB7TG9nZ2VyfVxuICovXG5Mb2dnZXJGYWN0b3J5LnByb3RvdHlwZS5nZXRMb2dnZXIgPSBmdW5jdGlvbiAobmFtZSwgbGV2ZWwsIHVwbG9hZCwgc2lsZW50KSB7XG4gIG5hbWUgPSBuYW1lIHx8ICcnO1xuXG4gIGlmICh1cGxvYWQpIHtcbiAgICBVcGxvYWRlci5zdGFydEludGVydmFsKCk7XG4gIH1cblxuICBpZiAobG9nZ2Vyc1tuYW1lXSkge1xuICAgIHJldHVybiBsb2dnZXJzW25hbWVdO1xuICB9IGVsc2Uge1xuICAgIGxvZ2dlcnNbbmFtZV0gPSBuZXcgTG9nZ2VyKG5hbWUsIGxldmVsLCB1cGxvYWQsIHNpbGVudCk7XG5cbiAgICByZXR1cm4gbG9nZ2Vyc1tuYW1lXTtcbiAgfVxufTtcblxuXG4vKipcbiAqIEBwdWJsaWNcbiAqIFNldCB0aGUgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gdXBsb2FkIGxvZ3MuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB1cGxvYWRGblxuICovXG5Mb2dnZXJGYWN0b3J5LnByb3RvdHlwZS5zZXRVcGxvYWRGbiA9IFVwbG9hZGVyLnNldFVwbG9hZEZuO1xuXG5cbi8qKlxuICogQHB1YmxpY1xuICogRm9yY2UgbG9ncyB0byB1cGxvYWQgYXQgdGhpcyB0aW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXVxuICovXG5Mb2dnZXJGYWN0b3J5LnByb3RvdHlwZS51cGxvYWQgPSBVcGxvYWRlci51cGxvYWQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIEZpbHRoeSBoYWNrIGZvciBub2RlLmpzIHRlc3RpbmcsIGluIHRoZSBmdXR1cmUgc3RvcmFnZSBzaG91bGQgYmUgc2hlbGxlZFxuLy8gb3V0IHRvIHN0b3JhZ2UgYWRhcHRlciBjbGFzc2VzIGFuZCB0aGlzIGFjdHMgYXMgYW4gaW50ZXJmYWNlIG9ubHlcbnZhciB3ID0ge307XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgdyA9IHdpbmRvdztcbn1cblxudmFyIGxzID0gdy5sb2NhbFN0b3JhZ2VcbiAgLCBzYWZlanNvbiA9IHJlcXVpcmUoJ3NhZmVqc29uJyk7XG5cbnZhciBJTkRFWF9LRVkgPSAnX2xvZ19pbmRleGVzXyc7XG5cblxuLyoqXG4gKiBHZW5lcmF0ZSBhbiBpbmRleCBmcm9tIGEgZ2l2ZW4gTG9nIE9iamVjdC5cbiAqIEBwYXJhbSB7TG9nfSBsb2dcbiAqL1xuZnVuY3Rpb24gZ2VuSW5kZXggKGxvZykge1xuICByZXR1cm4gJ19sb2dzXycgKyBsb2cuZ2V0RGF0ZSgpO1xufVxuXG5cbi8qKlxuICogR2V0IGFsbCBpbmRleGVzIChkYXlzIG9mIGxvZ3MpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufVxuICovXG52YXIgZ2V0SW5kZXhlcyA9IGV4cG9ydHMuZ2V0SW5kZXhlcyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICB2YXIgaW5kZXhlcyA9IGxzLmdldEl0ZW0oSU5ERVhfS0VZKTtcblxuICBzYWZlanNvbi5wYXJzZShpbmRleGVzLCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzID0gcmVzIHx8IFtdO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHJlcyk7XG4gICAgfVxuICB9KTtcbn07XG5cblxuLyoqXG4gKiBVcGRhdGUgbG9nIGluZGV4ZXMgYmFzZWQgb24gYSBuZXcgbG9nLlxuICogQHBhcmFtIHtMb2d9ICAgICAgIGxvZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gIGNhbGxiYWNrXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUluZGV4ZXMgKGxvZywgY2FsbGJhY2spIHtcbiAgZ2V0SW5kZXhlcyhmdW5jdGlvbiAoZXJyLCBpbmRleGVzKSB7XG4gICAgdmFyIGlkeCA9IGdlbkluZGV4KGxvZyk7XG5cbiAgICAvLyBEbyB3ZSB1cGRhdGUgaW5kZXhlcz9cbiAgICBpZiAoaW5kZXhlcy5pbmRleE9mKGlkeCkgPT09IC0xKSB7XG4gICAgICBpbmRleGVzLnB1c2goaWR4KTtcblxuICAgICAgc2FmZWpzb24uc3RyaW5naWZ5KGluZGV4ZXMsIGZ1bmN0aW9uIChlcnIsIGlkeHMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBscy5zZXRJdGVtKGlkeCwgaWR4cyk7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIGluZGV4ZXMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGUsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIG51bGwpO1xuICAgIH1cbiAgfSk7XG59XG5cblxuLyoqXG4gKiBHZXQgYWxsIGxvZ3MgZm9yIGEgZGF0ZS9pbmRleFxuICogQHBhcmFtIHtTdHJpbmd9ICAgIGluZGV4XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAgY2FsbGJhY2tcbiAqL1xudmFyIGdldExvZ3NGb3JJbmRleCA9IGV4cG9ydHMuZ2V0TG9nc0ZvckluZGV4ID0gZnVuY3Rpb24gKGluZGV4LCBjYWxsYmFjaykge1xuICBzYWZlanNvbi5wYXJzZShscy5nZXRJdGVtKGluZGV4KSwgZnVuY3Rpb24gKGVyciwgbG9ncykge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGlzIGRhdGUgaXNuJ3QgY3JlYXRlZCB5ZXQsIGRvIHNvIG5vd1xuICAgICAgbG9ncyA9IGxvZ3MgfHwgW107XG5cbiAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBsb2dzKTtcbiAgICB9XG4gIH0pO1xufTtcblxuXG4vKipcbiAqIFNhdmUgbG9ncyBmb3IgdGhlIGdpdmVuIGRhdGUgKGluZGV4KVxuICogQHBhcmFtIHtTdHJpbmd9XG4gKiBAcGFyYW0ge0FycmF5fVxuICogQHBhcmFtIHtGdW5jdGlvbn1cbiAqL1xuZnVuY3Rpb24gc2F2ZUxvZ3NGb3JJbmRleCAobG9nc0luZGV4LCBsb2dzLCBjYWxsYmFjaykge1xuICBzYWZlanNvbi5zdHJpbmdpZnkobG9ncywgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxzLnNldEl0ZW0obG9nc0luZGV4LCByZXMpO1xuXG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgbG9ncyk7XG4gICAgfVxuICB9KTtcbn1cblxuXG4vKipcbiAqIFdyaXRlIGEgbG9nIHRvIHBlcm1hbmVudCBzdG9yYWdlXG4gKiBAcGFyYW0ge0xvZ31cbiAqIEBwYXJhbSB7RnVuY3Rpb259XG4gKi9cbmV4cG9ydHMud3JpdGVMb2cgPSBmdW5jdGlvbiAobG9nLCBjYWxsYmFjaykge1xuICB1cGRhdGVJbmRleGVzKGxvZywgZnVuY3Rpb24gKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgIH1cblxuICAgIHZhciBsb2dzSW5kZXggPSBnZW5JbmRleChsb2cpO1xuXG4gICAgZ2V0TG9nc0ZvckluZGV4KGxvZ3NJbmRleCwgZnVuY3Rpb24gKGVyciwgbG9ncykge1xuICAgICAgbG9ncy5wdXNoKGxvZy50b0pTT04oKSk7XG5cbiAgICAgIHNhdmVMb2dzRm9ySW5kZXgobG9nc0luZGV4LCBsb2dzLCBjYWxsYmFjayk7XG4gICAgfSk7XG4gIH0pO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFN0b3JhZ2UgPSByZXF1aXJlKCcuL1N0b3JhZ2UnKVxuICAsIHNhZmVqc29uID0gcmVxdWlyZSgnc2FmZWpzb24nKTtcblxuXG52YXIgdXBsb2FkRm4gPSBudWxsXG4gICwgdXBsb2FkSW5Qcm9ncmVzcyA9IGZhbHNlXG4gICwgdXBsb2FkVGltZXIgPSBudWxsO1xuXG5cbmZ1bmN0aW9uIGRlZmF1bHRVcGxvYWRDYWxsYmFjayhlcnIpIHtcbiAgaWYgKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ2xvZ2dlciBlbmNvdW50ZXJlZCBhbiBlcnJvciB1cGxvYWRpbmcgbG9ncycsIGVycik7XG4gIH1cbn1cblxuXG4vKipcbiAqIFN0YXJ0IHRoZSB0aW1lciB0byB1cGxvYWQgbG9ncyBpbiBpbnRlcnZhbHMuXG4gKi9cbmV4cG9ydHMuc3RhcnRJbnRlcnZhbCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF1cGxvYWRUaW1lcikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHVwbG9hZFRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi51cGxvYWQoKTtcbiAgICB9LCA2MDAwMCk7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBTZXQgdGhlIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gdXBsb2FkIGxvZ3MuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICovXG5leHBvcnRzLnNldFVwbG9hZEZuID0gZnVuY3Rpb24gKGZuKSB7XG4gIHVwbG9hZEZuID0gZm47XG59O1xuXG5cbi8qKlxuICogR2V0IHRoZSBmdW5jdGlvbiBiZWluZyB1c2VkIHRvIHVwbG9hZCBsb2dzLlxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cbmV4cG9ydHMuZ2V0VXBsb2FkRm4gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB1cGxvYWRGbjtcbn07XG5cblxuLyoqXG4gKiBVcGxvYWQgbG9ncywgYWx3YXlzIHVwbG9hZHMgdGhlIG9sZGVzdCBkYXkgb2YgbG9ncyBmaXJzdC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259XG4gKi9cbmV4cG9ydHMudXBsb2FkID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIC8vIFNldCBhIGNhbGxiYWNrIGZvciB1cGxvYWQgY29tcGxldGVcbiAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBkZWZhdWx0VXBsb2FkQ2FsbGJhY2s7XG5cbiAgaWYgKCF1cGxvYWRGbikge1xuICAgIHJldHVybiBjYWxsYmFjaygnQ2FsbGVkIHVwbG9hZCB3aXRob3V0IHNldHRpbmcgYW4gdXBsb2FkIGZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAoIXVwbG9hZEluUHJvZ3Jlc3MpIHtcbiAgICBjb25zb2xlLmxvZygnVXBsb2FkIGFscmVhZHkgaW4gcHJvZ3Jlc3MuIFNraXBwaW5nIHNlY29uZCBjYWxsLicpO1xuICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBudWxsKTtcbiAgfVxuXG4gIC8vIEZsYWcgdGhhdCB3ZSBhcmUgdXBsb2FkaW5nXG4gIHVwbG9hZEluUHJvZ3Jlc3MgPSB0cnVlO1xuXG4gIFN0b3JhZ2UuZ2V0SW5kZXhlcyhmdW5jdGlvbiAoZXJyLCBpZHhzKSB7XG4gICAgaWYgKGlkeHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB1cGxvYWRJblByb2dyZXNzID0gZmFsc2U7XG5cbiAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICAvLyBPbGRlc3QgbG9ncyBzaG91bGQgYmUgdXBsb2FkZWQgZmlyc3RcbiAgICB2YXIgZGF0ZSA9IGlkeHMuc29ydCgpWzBdO1xuXG4gICAgU3RvcmFnZS5nZXRMb2dzRm9ySW5kZXgoZGF0ZSwgZnVuY3Rpb24gKGVyciwgbG9ncykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICB1cGxvYWRJblByb2dyZXNzID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICB9XG5cbiAgICAgIHNhZmVqc29uLnN0cmluZ2lmeShsb2dzLCBmdW5jdGlvbiAoZXJyLCBzdHIpIHtcbiAgICAgICAgdXBsb2FkRm4oc3RyLCAgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgIHVwbG9hZEluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgICBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn07XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgTEVWRUxTID0gcmVxdWlyZSgnLi4vTGV2ZWxzJyk7XG5cbi8qKlxuICogTG9ncyBvdXRwdXQgdXNpbmcgTm9kZS5qcyBzdGRpbi9zdGRlcnIgc3RyZWFtLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBsZXZlbFxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICovXG5mdW5jdGlvbiBub2RlTG9nIChsZXZlbCwgc3RyKSB7XG4gIGlmIChsZXZlbCA9PT0gTEVWRUxTLkVSUk9SKSB7XG4gICAgcHJvY2Vzcy5zdGRlcnIud3JpdGUoc3RyICsgJ1xcbicpO1xuICB9IGVsc2Uge1xuICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKHN0ciArICdcXG4nKTtcbiAgfVxufVxuXG5cbi8qKlxuICogTG9ncyBvdXRwdXQgdXNpbmcgdGhlIGJyb3dzZXIncyBjb25zb2xlIG9iamVjdC5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gbGV2ZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqL1xuZnVuY3Rpb24gYnJvd3NlckxvZyAobGV2ZWwsIHN0cikge1xuICB2YXIgbG9nRm4gPSBjb25zb2xlLmxvZztcblxuICBzd2l0Y2ggKGxldmVsKSB7XG4gICAgY2FzZSBMRVZFTFMuREVCVUc6XG4gICAgICAvLyBjb25zb2xlLmRlYnVnIGlzIG5vdCBhdmFpbGFibGUgaW4gTm9kZSBsYW5kXG4gICAgICBsb2dGbiA9IGNvbnNvbGUuZGVidWcgfHwgY29uc29sZS5sb2c7XG4gICAgICBicmVhaztcbiAgICBjYXNlIExFVkVMUy5JTkZPOlxuICAgICAgLy8gY29uc29sZS5pbmZvIGlzIG5vdCBhdmFpbGFibGUgaW4gTm9kZSBsYW5kIGVpdGhlclxuICAgICAgbG9nRm4gPSBjb25zb2xlLmluZm8gfHwgY29uc29sZS5sb2c7XG4gICAgICBicmVhaztcbiAgICBjYXNlIExFVkVMUy5XQVJOOlxuICAgICAgbG9nRm4gPSBjb25zb2xlLndhcm47XG4gICAgICBicmVhaztcbiAgICBjYXNlIExFVkVMUy5FUlJPUjpcbiAgICAgIGxvZ0ZuID0gY29uc29sZS5lcnJvcjtcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgbG9nRm4uY2FsbChjb25zb2xlLCBzdHIpO1xufVxuXG5cbmlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IG5vZGVMb2c7XG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IGJyb3dzZXJMb2c7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiRldhQVNIXCIpKSIsIid1c2Ugc3RyaWN0JztcblxuXG5leHBvcnRzLnRyYW5zcG9ydHMgPSB7XG4gICdjb25zb2xlJzogcmVxdWlyZSgnLi9jb25zb2xlJylcbn07XG5cbi8vIFRyYW5zcG9ydHMgdG8gdXNlLCBkZWZhdWx0IGluY2x1ZXMgY29uc29sZVxudmFyIGFjdGl2ZVRyYW5zcG9ydHMgPSBbZXhwb3J0cy50cmFuc3BvcnRzLmNvbnNvbGVdO1xuXG4vKipcbiAqIExvZyB0aGUgcHJvdmlkZWQgbG9nIHRvIHRoZSBhY3RpdmUgdHJhbnNwb3J0cy5cbiAqIEBwdWJsaWNcbiAqIEBwYXJhbSB7TnVtYmVyfSBsZXZlbFxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICovXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uIChsZXZlbCwgc3RyKSB7XG4gIGZvciAodmFyIGkgaW4gYWN0aXZlVHJhbnNwb3J0cykge1xuICAgIGFjdGl2ZVRyYW5zcG9ydHNbaV0obGV2ZWwsIHN0cik7XG4gIH1cbn07XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuLy8gRGV0ZXJtaW5lcyB3ZXRoZXIgYWN0aW9ucyBzaG91bGQgYmUgZGVmZXJyZWQgZm9yIHByb2Nlc3NpbmdcbmV4cG9ydHMuZGVmZXIgPSBmYWxzZTtcblxuXG4vKipcbiAqIERlZmVyIGEgZnVuY3Rpb24gY2FsbCBtb21lbnRhaXJseS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKi9cbmZ1bmN0aW9uIGRlZmVycmVkKGZuKSB7XG4gIGlmIChleHBvcnRzLmRlZmVyID09PSB0cnVlKSB7XG4gICAgcHJvY2Vzcy5uZXh0VGljayhmbik7XG4gIH0gZWxzZSB7XG4gICAgZm4oKTtcbiAgfVxufVxuXG5cbi8qKlxuICogU3RyaW5naWZ5IEpTT04gYW5kIGNhdGNoIGFueSBwb3NzaWJsZSBleGNlcHRpb25zLlxuICogQHBhcmFtIHtPYmplY3R9ICAgIGpzb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259ICBbcmVwbGFjZXJdXG4gKiBAcGFyYW0ge051bWJlcn0gICAgW3NwYWNlc11cbiAqIEBwYXJhbSB7RnVuY3Rpb259ICBjYWxsYmFja1xuICovXG5leHBvcnRzLnN0cmluZ2lmeSA9IGZ1bmN0aW9uICgvKmpzb24sIHJlcGxhY2VyLCBzcGFjZXMsIGNhbGxiYWNrKi8pIHtcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgLCBjYWxsYmFjayA9IGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSwgYXJncy5sZW5ndGgpWzBdO1xuXG4gIGRlZmVycmVkKGZ1bmN0aW9uKCkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgSlNPTi5zdHJpbmdpZnkuYXBwbHkobnVsbCwgYXJncykpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlLCBudWxsKTtcbiAgICB9XG4gIH0pO1xufTtcblxuXG4vKipcbiAqIFBhcnNlIHN0cmluZyBvZiBKU09OIGFuZCBjYXRjaCBhbnkgcG9zc2libGUgZXhjZXB0aW9ucy5cbiAqIEBwYXJhbSB7U3RyaW5nfSAgICBqc29uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAgW3Jldml2ZXJdXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAgY2FsbGJhY2tcbiAqL1xuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uICgvKmpzb24sIHJldml2ZXIsIGNhbGxiYWNrKi8pIHtcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgLCBjYWxsYmFjayA9IGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSwgYXJncy5sZW5ndGgpWzBdO1xuXG4gIGRlZmVycmVkKGZ1bmN0aW9uKCkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgSlNPTi5wYXJzZS5hcHBseShudWxsLCBhcmdzKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGUsIG51bGwpO1xuICAgIH1cbiAgfSk7XG59O1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJGV2FBU0hcIikpIiwibW9kdWxlLmV4cG9ydHMgPSBleHRlbmRcblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICAgIHZhciB0YXJnZXQgPSB7fVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXRcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGZobG9nID0gcmVxdWlyZSgnZmhsb2cnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIFNpbXBseSB1c2UgZmhsb2chIE1heSBjaGFuZ2UuLi5cbiAgcmV0dXJuIGZobG9nO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyLm1vZHVsZSgnbmdGSCcpXG4gIC5mYWN0b3J5KCdMb2cnLCByZXF1aXJlKCcuL0xvZy5qcycpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gUmVnaXN0ZXIgbmdGSCBtb2R1bGVcbm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ25nRkgnLCBbJ25nJ10pO1xuXG4vLyBCaW5kIG91ciBtb2R1bGVzIHRvIG5nRkhcbnJlcXVpcmUoJy4vZmFjdG9yaWVzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBmaCA9ICRmaCAvLyBPbmNlIGZoLWpzLXNkayBpcyBvbiBucG0gd2UgY2FuIHJlcXVpcmUgaXQgaGVyZVxuICAsIHByaW50TG9ncyA9IHRydWVcbiAgLCBkZWZhdWx0VGltZW91dCA9IDMwICogMTAwMDtcblxuXG4vKipcbiAqIFNlcnZpY2UgdG8gcmVwcmVzZW50IEZILkFjdFxuICogQG1vZHVsZSBBY3RcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoVXRpbHMsIExvZywgJHEsICR0aW1lb3V0KSB7XG4gIHZhciBsb2cgPSBMb2cuZ2V0TG9nZ2VyKCdGSC5BY3QnKTtcblxuICAvLyBFcnJvciBzdHJpbmdzIHVzZWQgZm9yIGVycm9yIHR5cGUgZGV0ZWN0aW9uXG4gIHZhciBBQ1RfRVJST1JTID0ge1xuICAgIFBBUlNFX0VSUk9SOiAncGFyc2VlcnJvcicsXG4gICAgTk9fQUNUTkFNRTogJ2FjdF9ub19hY3Rpb24nLFxuICAgIFVOS05PV05fQUNUOiAnbm8gc3VjaCBmdW5jdGlvbicsXG4gICAgSU5URVJOQUxfRVJST1I6ICdpbnRlcm5hbCBlcnJvciBpbicsXG4gICAgVElNRU9VVDogJ3RpbWVvdXQnXG4gIH07XG5cblxuICAvKipcbiAgICogRXhwb3NlZCBlcnJvciB0eXBlcyBmb3IgY2hlY2tzIGJ5IGRldmVsb3BlcnMuXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHZhciBFUlJPUlMgPSB0aGlzLkVSUk9SUyA9IHtcbiAgICBOT19BQ1ROQU1FX1BST1ZJREVEOiAnTk9fQUNUTkFNRV9QUk9WSURFRCcsXG4gICAgVU5LTk9XTl9FUlJPUjogJ1VOS05PV05fRVJST1InLFxuICAgIFVOS05PV05fQUNUOiAnVU5LTk9XTl9BQ1QnLFxuICAgIENMT1VEX0VSUk9SOiAnQ0xPVURfRVJST1InLFxuICAgIFRJTUVPVVQ6ICdUSU1FT1VUJyxcbiAgICBQQVJTRV9FUlJPUjogJ1BBUlNFX0VSUk9SJyxcbiAgICBOT19ORVRXT1JLOiAnTk9fTkVUV09SSydcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDYWxsZWQgb24gYSBzdWNjZXNzZnVsIGFjdCBjYWxsICh3aGVuIG1haW4uanMgY2FsbGJhY2sgaXMgY2FsbGVkIHdpdGggYVxuICAgKiBudWxsIGVycm9yIHBhcmFtKVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgICAgIGFjdG5hbWVcbiAgICogQHBhcmFtICAge09iamVjdH0gICAgICByZXNcbiAgICogQHBhcmFtICAge0Z1bmN0aW9ufSAgICBjYWxsYmFja1xuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VTdWNjZXNzKGFjdG5hbWUsIHJlcykge1xuICAgIGxvZy5kZWJ1ZygnQ2FsbGVkIFwiJyArIGFjdG5hbWUgKyAnXCIgc3VjY2Vzc2Z1bGx5LicpO1xuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIGFuIGFjdCBjYWxsIGhhcyBmYWlsZWQuIENyZWF0ZXMgYSBtZWFuaW5nZnVsIGVycm9yIHN0cmluZy5cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtICAge1N0cmluZ30gICAgICBhY3RuYW1lXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICAgICAgZXJyXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICAgICAgZGV0YWlsc1xuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VGYWlsKGFjdG5hbWUsIGVyciwgZGV0YWlscykge1xuICAgIHZhciBFUlIgPSBudWxsO1xuXG4gICAgaWYgKGVyciA9PT0gQUNUX0VSUk9SUy5OT19BQ1ROQU1FKSB7XG4gICAgICBFUlIgPSBFUlJPUlMuTk9fQUNUTkFNRV9QUk9WSURFRDtcbiAgICB9IGVsc2UgaWYgKGVyciAhPT0gJ2Vycm9yX2FqYXhmYWlsJykge1xuICAgICAgRVJSID0gRVJST1JTLlVOS05PV05fRVJST1I7XG4gICAgfSBlbHNlIGlmIChlcnIgPT09IEVSUk9SUy5OT19BQ1ROQU1FX1BST1ZJREVEKSB7XG4gICAgICBFUlIgPSBFUlJPUlMuTk9fQUNUTkFNRV9QUk9WSURFRDtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgZGV0YWlscy5lcnJvci50b0xvd2VyQ2FzZSgpLmluZGV4T2YoQUNUX0VSUk9SUy5VTktOT1dOX0FDVCkgPj0gMCkge1xuICAgICAgRVJSID0gRVJST1JTLlVOS05PV05fQUNUO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBkZXRhaWxzLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmRleE9mKEFDVF9FUlJPUlMuVElNRU9VVCkgPj0gMCkge1xuICAgICAgRVJSID0gRVJST1JTLlRJTUVPVVQ7XG4gICAgfSBlbHNlIGlmIChkZXRhaWxzLm1lc3NhZ2UgPT09IEFDVF9FUlJPUlMuUEFSU0VfRVJST1IpIHtcbiAgICAgIEVSUiA9IEVSUk9SUy5QQVJTRV9FUlJPUjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ2xvdWQgY29kZSBzZW50IGVycm9yIHRvIGl0J3MgY2FsbGJhY2tcbiAgICAgIGxvZy5kZWJ1ZygnXCIlc1wiIGVuY291bnRlcmVkIGFuIGVycm9yIGluIGl0XFwncyBjbG91ZCBjb2RlLiBFcnJvciAnICtcbiAgICAgICAgJ1N0cmluZzogJXMsIEVycm9yIE9iamVjdDogJW8nLCBhY3RuYW1lLCBlcnIsIGRldGFpbHMpO1xuICAgICAgRVJSID0gRVJST1JTLkNMT1VEX0VSUk9SO1xuICAgIH1cblxuICAgIGxvZy5kZWJ1ZygnXCIlc1wiIGZhaWxlZCB3aXRoIGVycm9yICVzJywgYWN0bmFtZSwgRVJSKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBFUlIsXG4gICAgICBlcnI6IGVycixcbiAgICAgIG1zZzogZGV0YWlsc1xuICAgIH07XG4gIH1cblxuXG4gIC8qKlxuICAgKiBDYWxsIGFuIGFjdGlvbiBvbiB0aGUgY2xvdWQuXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtICAge09iamVjdH0gICAgICBvcHRzXG4gICAqIEBwYXJhbSAgIHtGdW5jdGlvbn0gICAgW2NhbGxiYWNrXVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZXxudWxsfVxuICAgKi9cbiAgdGhpcy5yZXF1ZXN0ID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKClcbiAgICAgICwgc3VjY2Vzc1xuICAgICAgLCBmYWlsO1xuXG4gICAgLy8gRGVmZXIgY2FsbCBzbyB3ZSBjYW4gcmV0dXJuIHByb21pc2UgZmlyc3RcbiAgICBpZiAoVXRpbHMuaXNPbmxpbmUoKSkge1xuICAgICAgbG9nLmRlYnVnKCdNYWtpbmcgY2FsbCB3aXRoIG9wdHMgJWonLCBvcHRzKTtcblxuICAgICAgc3VjY2VzcyA9IFV0aWxzLnNhZmVDYWxsYmFjayhmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUocGFyc2VTdWNjZXNzKG9wdHMuYWN0LCByZXMpKTtcbiAgICAgIH0pO1xuXG4gICAgICBmYWlsID0gVXRpbHMuc2FmZUNhbGxiYWNrKGZ1bmN0aW9uIChlcnIsIG1zZykge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QocGFyc2VGYWlsKG9wdHMuYWN0LCBlcnIsIG1zZykpO1xuICAgICAgfSk7XG5cbiAgICAgIGZoLmFjdChvcHRzLCBzdWNjZXNzLCBmYWlsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nLmRlYnVnKCdDYW5cXCd0IG1ha2UgYWN0IGNhbGwsIG5vIG5ldG93cmsuIE9wdHM6ICVqJywgb3B0cyk7XG5cbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KHtcbiAgICAgICAgICB0eXBlOiBFUlJPUlMuTk9fTkVUV09SSyxcbiAgICAgICAgICBlcnI6IG51bGwsXG4gICAgICAgICAgbXNnOiBudWxsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gIH07XG5cblxuICAvKipcbiAgICogR2V0IHRoZSBkZWZhdWx0IHRpbWVvdXQgZm9yIEFjdCBjYWxscyBpbiBtaWxsaXNlY29uZHNcbiAgICogQHB1YmxpY1xuICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5nZXREZWZhdWx0VGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZGVmYXVsdFRpbWVvdXQ7XG4gIH07XG5cblxuICAvKipcbiAgICogU2V0IHRoZSBkZWZhdWx0IHRpbWVvdXQgZm9yIEFjdCBjYWxscyBpbiBtaWxsaXNlY29uZHNcbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0ge051bWJlcn0gdCBUaGUgdGltZW91dCwgaW4gbWlsbGlzZWNvbmRzLCB0byB1c2VcbiAgICovXG4gIHRoaXMuc2V0RGVmYXVsdFRpbWVvdXQgPSBmdW5jdGlvbih0KSB7XG4gICAgZGVmYXVsdFRpbWVvdXQgPSB0O1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIERpc2JhbGUgZGVidWdnaW5nIGxvZ2dpbmcgYnkgdGhpcyBzZXJ2aWNlXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHRoaXMuZGlzYWJsZUxvZ2dpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBsb2cuc2V0U2lsZW50KHRydWUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBFbmFibGUgZGVidWcgbG9nZ2luZyBieSB0aGlzIHNlcnZpY2VcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdGhpcy5lbmFibGVMb2dnaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgbG9nLnNldFNpbGVudChmYWxzZSk7XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgeHRlbmQgPSByZXF1aXJlKCd4dGVuZCcpXG4gICwgZmggPSAkZmggLy8gT25jZSBmaC1qcy1zZGsgaXMgb24gbnBtIHdlIGNhbiByZXF1aXJlIGl0IGhlcmVcbiAgLCBwcmludExvZ3MgPSB0cnVlXG4gICwgdGltZW91dCA9IDMwICogMTAwMDtcblxudmFyIERFRkFVTFRfT1BUUyA9IHtcbiAgdHlwZTogJ0dFVCcsXG4gIHBhdGg6ICcvY2xvdWQvJyxcbiAgdGltZW91dDogdGltZW91dCxcbiAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgZGF0YToge31cbn07XG5cbi8qKlxuICogU2VydmljZSB0byByZXByZXNlbnQgRkguQ2xvdWRcbiAqIEBtb2R1bGUgQ2xvdWRcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoVXRpbHMsIExvZywgJHEsICR0aW1lb3V0KSB7XG4gIHZhciBsb2cgPSBMb2cuZ2V0TG9nZ2VyKCdGSC5DbG91ZCcpO1xuXG4gIC8qKlxuICAgKiBQZXJmb3JtIHRoZSBjbG91ZCByZXF1ZXN0IHJldHVybmluZyBhIHByb21pc2Ugb3IgbnVsbC5cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtICAge09iamVjdH0gICAgb3B0c1xuICAgKiBAcGFyYW0gICB7RnVuY3Rpb259ICBbY2FsbGJhY2tdXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfG51bGx9XG4gICAqL1xuICBmdW5jdGlvbiBjbG91ZFJlcXVlc3QgKG9wdHMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHByb21pc2UgPSBudWxsO1xuXG4gICAgLy8gRGVmaW5lIGFsbCBvcHRpb25zXG4gICAgb3B0cyA9IHh0ZW5kKERFRkFVTFRfT1BUUywgb3B0cyk7XG5cbiAgICAvLyBXZSBuZWVkIHRvIHVzZSBwcm9taXNlcyBhcyB1c2VyIGRpZG4ndCBwcm92aWRlIGEgY2FsbGJhY2tcbiAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICBwcm9taXNlID0gJHEuZGVmZXIoKTtcblxuICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHJlcyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gRGVmZXIgY2FsbCBzbyB3ZSBjYW4gcmV0dXJuIHByb21pc2VcbiAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBsb2cuZGVidWcoJ0NhbGwgd2l0aCBvcHRpb25zOiAlaicsIG9wdHMpO1xuXG4gICAgICBmaC5jbG91ZChvcHRzLCBVdGlscy5vblN1Y2Nlc3MoY2FsbGJhY2spLCBVdGlscy5vbkZhaWwoY2FsbGJhY2spKTtcbiAgICB9LCAwKTtcblxuICAgIC8vIFJldHJ1biBwcm9taXNlIG9yIG51bGxcbiAgICByZXR1cm4gKHByb21pc2UgIT09IG51bGwpID8gcHJvbWlzZS5wcm9taXNlIDogbnVsbDtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIFV0aWxpdHkgZm4gdG8gc2F2ZSBjb2RlIGR1cGxpY2F0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9IHZlcmJcbiAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgKi9cbiAgZnVuY3Rpb24gX2dlblZlcmJGdW5jICh2ZXJiKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChwYXRoLCBkYXRhLCBjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIGNsb3VkUmVxdWVzdCh7XG4gICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIHR5cGU6IHZlcmIudG9VcHBlckNhc2UoKVxuICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH07XG4gIH1cblxuXG4gIC8qKlxuICAgKiBTaG9ydGhhbmQgbWV0aG9kIGZvciBHRVQgcmVxdWVzdC5cbiAgICogQHB1YmxpY1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtICAge1N0cmluZ30gIHBhdGhcbiAgICogQHBhcmFtICAge01peGVkfSAgIGRhdGFcbiAgICogQHJldHVybnMge1Byb21pc2V8bnVsbH1cbiAgICovXG4gIHRoaXMuZ2V0ICAgICAgICAgID0gX2dlblZlcmJGdW5jKCdHRVQnKTtcblxuXG4gIC8qKlxuICAgKiBTaG9ydGhhbmQgbWV0aG9kIGZvciBQVVQgcmVxdWVzdC5cbiAgICogQHB1YmxpY1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtICAge1N0cmluZ30gIHBhdGhcbiAgICogQHBhcmFtICAge01peGVkfSAgIGRhdGFcbiAgICogQHJldHVybnMge1Byb21pc2V8bnVsbH1cbiAgICovXG4gIHRoaXMucHV0ICAgICAgICAgID0gX2dlblZlcmJGdW5jKCdQVVQnKTtcblxuXG4gIC8qKlxuICAgKiBTaG9ydGhhbmQgbWV0aG9kIGZvciBQT1NUIHJlcXVlc3QuXG4gICAqIEBwdWJsaWNcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICBwYXRoXG4gICAqIEBwYXJhbSAgIHtNaXhlZH0gICBkYXRhXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfG51bGx9XG4gICAqL1xuICB0aGlzLnBvc3QgICAgICAgICA9IF9nZW5WZXJiRnVuYygnUE9TVCcpO1xuXG5cbiAgLyoqXG4gICAqIFNob3J0aGFuZCBtZXRob2QgZm9yIEhFQUQgcmVxdWVzdC5cbiAgICogQHB1YmxpY1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtICAge1N0cmluZ30gIHBhdGhcbiAgICogQHBhcmFtICAge01peGVkfSAgIGRhdGFcbiAgICogQHJldHVybnMge1Byb21pc2V8bnVsbH1cbiAgICovXG4gIHRoaXMuaGVhZCAgICAgICAgID0gX2dlblZlcmJGdW5jKCdIRUFEJyk7XG5cblxuICAvKipcbiAgICogU2hvcnRoYW5kIG1ldGhvZCBmb3IgREVMRVRFIHJlcXVlc3QuXG4gICAqIEBwdWJsaWNcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICBwYXRoXG4gICAqIEBwYXJhbSAgIHtNaXhlZH0gICBkYXRhXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfG51bGx9XG4gICAqL1xuICB0aGlzWydkZWxldGUnXSAgICA9IF9nZW5WZXJiRnVuYygnREVMRVRFJyk7XG5cblxuXG5cbiAgLyoqXG4gICAqIE1hbnVhbGx5IHByb3ZpZGUgSFRUUCB2ZXJiIGFuZCBhbGwgb3B0aW9ucyBhcyBwZXIgU0RLIGRvY3MuXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtICAge09iamVjdH0gICAgb3B0cyAgICAgIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIHJlcXVlc3RcbiAgICogQHBhcmFtICAge0Z1bmN0aW9ufSAgY2FsbGJhY2sgIENhbGxiYWNrIGZ1bmN0aW9uXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfG51bGx9XG4gICAqL1xuICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbiAob3B0cywgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gY2xvdWRSZXF1ZXN0KG9wdHMsIGNhbGxiYWNrKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRlZmF1bHQgdGltZW91dCBmb3IgQ2xvdWQgY2FsbHMgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEBwdWJsaWNcbiAgICogQHJldHVybnMge051bWJlcn1cbiAgICovXG4gIHRoaXMuZ2V0RGVmYXVsdFRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRpbWVvdXQ7XG4gIH07XG5cblxuICAvKipcbiAgICogU2V0IHRoZSBkZWZhdWx0IHRpbWVvdXQgZm9yIENsb3VkIGNhbGxzIGluIG1pbGxpc2Vjb25kc1xuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB0IE5ldyB0aW1lb3V0IHZhbHVlIGluIG1pbGxpc2Vjb25kc1xuICAgKi9cbiAgdGhpcy5zZXREZWZhdWx0VGltZW91dCA9IGZ1bmN0aW9uKHQpIHtcbiAgICB0aW1lb3V0ID0gdDtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBEaXNiYWxlIGRlYnVnZ2luZyBsb2dnaW5nIGJ5IHRoaXMgc2VydmljZVxuICAgKiBAcHVibGljXG4gICAqL1xuICB0aGlzLmRpc2FibGVMb2dnaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcHJpbnRMb2dzID0gZmFsc2U7XG4gIH07XG5cblxuICAvKipcbiAgICogRW5hYmxlIGRlYnVnIGxvZ2dpbmcgYnkgdGhpcyBzZXJ2aWNlXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHRoaXMuZW5hYmxlTG9nZ2luZyA9IGZ1bmN0aW9uKCkge1xuICAgIHByaW50TG9ncyA9IHRydWU7XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkd2luZG93KSB7XG5cbiAgLyoqXG4gICAqIFNhZmVseSBjYWxsIGEgZnVuY3Rpb24gdGhhdCBtb2RpZmllcyB2YXJpYWJsZXMgb24gYSBzY29wZS5cbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKi9cbiAgdmFyIHNhZmVBcHBseSA9IHRoaXMuc2FmZUFwcGx5ID0gZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gICAgdmFyIHBoYXNlID0gJHJvb3RTY29wZS4kJHBoYXNlO1xuXG4gICAgaWYgKHBoYXNlID09PSAnJGFwcGx5JyB8fCBwaGFzZSA9PT0gJyRkaWdlc3QnKSB7XG4gICAgICBpZiAoYXJncykge1xuICAgICAgICBmbi5hcHBseShmbiwgYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbigpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYXJncykge1xuICAgICAgICAkcm9vdFNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZm4uYXBwbHkoZm4sIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZuKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogV3JhcCBhIGNhbGxiYWNrIGZvciBzYWZlIGV4ZWN1dGlvbi5cbiAgICogSWYgdGhlIGNhbGxiYWNrIGRvZXMgZnVydGhlciBhc3luYyB3b3JrIHRoZW4gdGhpcyBtYXkgbm90IHdvcmsuXG4gICAqIEBwYXJhbSAgIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgKi9cbiAgdGhpcy5zYWZlQ2FsbGJhY2sgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgICBzYWZlQXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICBjYWxsYmFjay5hcHBseShjYWxsYmFjaywgYXJncyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIENoZWNrIGZvciBhbiBpbnRlcm5ldCBjb25uZWN0aW9uLlxuICAgKiBAcHVibGljXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgdGhpcy5pc09ubGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJHdpbmRvdy5uYXZpZ2F0b3Iub25MaW5lO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIFdyYXAgYSBzdWNjZXNzIGNhbGxiYWNrIGluIE5vZGUuanMgc3R5bGUuXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtICAge0Z1bmN0aW9ufVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIHRoaXMub25TdWNjZXNzID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHNhZmVBcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZuIChudWxsLCByZXMpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBXcmFwIGEgZmFpbCBjYWxsYmFjayBpbiBOb2RlLmpzIHN0eWxlLlxuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSAgIHtGdW5jdGlvbn1cbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICB0aGlzLm9uRmFpbCA9IGZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBzYWZlQXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICBmbiAoZXJyLCBudWxsKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH07XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ25nRkgnKVxuICAuc2VydmljZSgnVXRpbHMnLCByZXF1aXJlKCcuL1V0aWxzLmpzJykpXG4gIC5zZXJ2aWNlKCdDbG91ZCcsIHJlcXVpcmUoJy4vQ2xvdWQuanMnKSlcbiAgLnNlcnZpY2UoJ0FjdCcsIHJlcXVpcmUoJy4vQWN0LmpzJykpO1xuIl19
