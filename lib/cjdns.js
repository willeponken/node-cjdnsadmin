var dgram = require('dgram'),
    bencode = require('bencode'),
    util = require('util'),
    semaphore = require('./semaphore')(4),
    crypto = require('crypto'),
    events = require('events'),
    path = require('path'),
    fs = require('fs');
var _this;
const TIMEOUT = 10000;

/*
 * @param adminConfFile path to the admin configuration file.
 * @param  options  an object containing options.
 *                  Example:
 *                    {
 *                      auth: false // do not use authorized requests
 *                    }
 */
var CJDNS = function (adminConfFile, options) {
  this.options = options ? options : { auth: true }; // Defined options or defaults

  // Parse admin and CJDNS config
  this.parseAdminConf(adminConfFile);
  this.parseCjdnsConf(this.adminConf);

  // Validate config
  var validAdminConf = this.checkConf(this.adminConf);
  var validCjdnsConf = this.checkConf(this.cjdnsConf);
 
  // Check CJDNS config and set host, port and password 
  if(validAdminConf) {
    this.port = this.adminConf.port || '11234';
    this.host = this.adminConf.addr || '127.0.0.1';
    this.password = this.options.auth ? this.adminConf.password : undefined;
  } else if(validCjdnsConf) {
    this.host = (this.cjdnsConf.admin.bind || 'localhost:11234').split(':');
    this.port = this.host[1] || '11234';
    this.host = this.host[0];
    this.password = this.options.auth ? this.cjdnsConf.admin.password : undefined;
  }

  _this = this;
  this.txid = Math.floor(Math.random() * 4000000000);

  // Create all the native methods
  this.funcFactory(function(err) {
    if (err) {
      throw err;
    }
  });

  return;
};

CJDNS.prototype.__proto__ = events.EventEmitter.prototype;

CJDNS.prototype.parseAdminConf = function parseAdminConf (confFile) {
  
  if (!confFile) {
    confFile = process.env['HOME'] + '/.cjdnsadmin';
  }

  confFile = fs.readFileSync(confFile);

  try {
    this.adminConf = JSON.parse(confFile);
  } catch (err) {
    console.warn('Warning: Failed to parse cjdnsadmin as JSON, falling back to eval()');

    eval('this.adminConf = ' + String(confFile));
  }

  return;
};

CJDNS.prototype.parseCjdnsConf = function parseCjdnsConf (adminConf) {

  var confFile = fs.readFileSync(adminConf.config);

  try {
    this.cjdnsConf = JSON.parse(confFile);
  } catch (err) {
    console.warn('Warning: Failed to parse cjdns config as JSON, falling back to eval()');

    eval('this.cjdnsConf = ' + String(confFile));
  }

  return;
};

CJDNS.prototype.checkConf = function(conf) {
  var adminConf = conf.password;
  var cjdnsConf = conf.admin ? conf.admin.password : undefined;

  if (!adminConf && !conf.config && !cjdnsConf) {
    throw new Error('Invalid .cjdnsadmin');
  } else {
    return (adminConf || cjdnsConf);
  }
};

CJDNS.prototype.send = function send (data, callback, optSock) {
  var msg = new Buffer(bencode.encode(data)),
      keepAlive = optSock ? true : false,
      socket = optSock || dgram.createSocket((this.host.indexOf(':') !== -1) ? 'udp6' : 'udp4');
 
  var sendTimeout = setTimeout(function timeout() {
    callback('Timeout after ' + TIMEOUT + 'ms');
    socket.close();
  }, TIMEOUT);

  socket.on('message', function (msg) {
    clearTimeout(sendTimeout);

    msg = bencode.decode(msg, 'utf8');

    if (!keepAlive) {
      socket.close();
    }

    return callback(null, msg);
  });

  socket.on('error', function(err) {
    clearTimeout(sendTimeout);
    socket.close();

    throw 'Socket error:\n' + err.stack;
  });

  socket.send(msg, 0, msg.length, this.port, this.host, function sendResult (err, bytes) {
    if (err) {
      clearTimeout(sendTimeout);
      return callback(err);
    }
  });
};

CJDNS.prototype.sendAuth = function sendAuth (data, callback, optSock) {
 if (this.password) {
    var authReq = {
      q: 'auth',
      aq: data.q,
      txid: this.txid++
    };

    if (data.args) {
      authReq.args = data.args;
    }

    function makeHash (password, cookie, authReq) {
      var hash = password + cookie,
          sha256 = crypto.createHash('sha256');

      sha256.update(hash);
      authReq.hash = sha256.digest('hex');

      sha256 = crypto.createHash('sha256');
      sha256.update(bencode.encode(authReq));

      return sha256.digest('hex');
    }

    this.send({ q: 'cookie' }, function (err, data) {
      if (err) {
        return callback(err);
      }

      authReq.cookie = data.cookie;
      authReq.hash = makeHash(_this.password, authReq.cookie, authReq);

      _this.send(authReq, callback, optSock);

      return;
    });
 } else { // Fallback to unauthorized request

   this.send(data, callback, optSock);
 }

  return;
};

CJDNS.prototype.funcFactory = function funcFactory (callback, optSock) {
  // Large portion of this code is from https://github.com/cjdelisle/cjdns/blob/4fb5c1a54745474b36c54ecbd3b000171f25dbc6/contrib/nodejs/cjdnsadmin/cjdnsadmin.js
  
  function callFunction(name, args, callback) {
    var msg = {
      q: name,
      args: {}
    };

    var argKeys = Object.keys(args),
        argLen = argKeys.length;

    for(var arg = 0; arg < argLen; arg++) {
      msg.args[argKeys[arg]] = args[argKeys[arg]];
    }

    _this.sendAuth(msg, callback);
  }

  function makeFunction(func) {
    var args = getArgs(func);

    return function () {
      var i, argLen = arguments.length;
      var argsOut = {};
      var callback = arguments[argLen - 1];

      for(i = 0; i < argLen - 1; i++) {
        var arg = arguments[i];

        if (!args[i].required && (arg === null || arg === undefined)) {
          continue;
        }

        if (!compatibleType(args[i].type, arg)) {
          throw new Error('Argument [' + i + '] [' + args[i].type + ' ' + args[i].name + ']' +
                          ' is of type [' + typeof(arg) + '] which is not compatible with ' +
                          'required type ' + args[i].type);
        }

        argsOut[args[i].name] = arg;
      }

      if (args.length > i && args[i].required) {
        throw new Error('argument [' + i + '] [' + args[i].type + ' ' + args[i].name + '] is ' +
                        'required and is not specified');
      }

      if (typeof(callback) !== 'function') {
        throw new Error('Callback is unspecified');
      }

      semaphore.take(function (returnAfter) {
        callFunction(func.name, argsOut, returnAfter(callback), optSock);
      });

    };
  }

  function compatibleType(type, obj) {
    switch (type) {
      case 'Int': return (typeof(obj) === 'number' && Math.floor(obj) === obj);
      case 'String': return (typeof(obj) === 'string');
      case 'Dict': return (typeof(obj) === 'object');
      case 'List': return Array.isArray(obj);
      default: throw new Error('Unable to find type for ' + type);
    }
  }

  function getArgs(func) {
    var params = func.params;

    function sortArgs(a, b) {
      a = a.name,
      b = b.name;

      return (a !== b) ? (a < b) ? 1 : -1 : 0;
    }

    var rArgs = [],
        oArgs = [];

    var argKeys = Object.keys(params),
        argLen = argKeys.length;

    for (var arg = 0; arg < argLen; arg++) {
      if (params[argKeys[arg]].required === 1) {
        rArgs.push({
          name: argKeys[arg],
          type: params[argKeys[arg]].type,
          required: true
        });
      } else if (params[argKeys[arg]].required === 0) {
        rArgs.push({
          name: argKeys[arg],
          type: params[argKeys[arg]].type,
          required: false
        });
      }
    }
    
    rArgs.sort(sortArgs);
    oArgs.sort(sortArgs);
    rArgs.push.apply(rArgs, oArgs);

    return rArgs;
  }

  this.Abs_availableFunctions(function (err, functions) {
    if (err) {
      throw err;
    }

    var funcLen = functions.length;
    for (var func = 0; func < funcLen; func++) {
      CJDNS.prototype[functions[func].name] = makeFunction(functions[func]);
    }

    return callback();
  });
};

/* 
 * ABSTRACTIONS
 */

/*
 * Ping
 */
CJDNS.prototype.Abs_ping = function ping (callback, optSock) {
  this.send({ q: 'ping' }, function (err, msg) {
    if (msg && msg.q === 'pong') {
      return callback(null, true);
    } else {
      return callback(msg, false);
    }
  }, optSock);

  return;
};

/* 
 * Admin Functions
 */
CJDNS.prototype.Abs_availableFunctions = function Abs_availableFunctions (callback, optSock) {
  var availableFunctions = [];

  function getFunctions (page) {
    _this.send({
      q: 'Admin_availableFunctions',
      args: {
        page: page
      }
    }, function (err, data) {
      var func;
      
      if (err) {
        return callback(err, null);
      }

      if (data.availableFunctions) {
        for (func in data.availableFunctions) {
          availableFunctions.push({
            name: func,
            params: data.availableFunctions[func]
          });
        }
      }

      if (data.more) {
        getFunctions(page + 1);
      } else {
        return callback(null, availableFunctions);
      }
    }, optSock);
  }

  getFunctions(0);

  return;
};
          
CJDNS.prototype.Abs_asyncEnabled = function Admin_asyncEnabled (callback, optSock) {
  this.sendAuth({ q: 'Admin_asyncEnabled' }, function (err, msg) {
    if (!err) {
      if (msg.asyncEnabled === 1) {
        return callback(null, true);
      } else if (msg.asyncEnabled === 0) {
        return callback(null, false);
      } else {
        return callback(msg, null);
      }
    } else {
      return callback(err, null);
    }
  }, optSock);

  return;
};

/*
 * AdminLog Functions
 */

/*
 * @param options An object containing { line: int, file: string, level: string }
 */
CJDNS.prototype.Abs_logSubscribe = function AdminLog_subscribe (options, callback) {
  var socket = dgram.createSocket('udp4');
  var streamId;

  this.sendAuth({
    q: 'AdminLog_subscribe',
    args: options
  }, function (err, msg) {
 
    //console.log('logging', err, msg);

    streamId = msg.streamId;
    _this.emit('log', err, msg);
 
  }, socket);

  this.logsHeartbeat = setInterval(function Heartbeat () {
    
    _this.Admin_asyncEnabled(function (err, result) {
      if (err) {
        return callback(err);
      }
      
      if (!result) {
        _this.AdminLog_unsubscribe(streamId);
        return callback('Subscription failed: Admin_asyncEnabled returned false');
      }
    }, socket);
  
  }, 9000);

  /*
  socket.on('listening', function() { console.log('Listening'); });
  socket.on('error' , function(err) { console.error('Error', err); });
  socket.on('closed', function() { console.info('Closed'); });
  */

  return;
};

module.exports = CJDNS;
