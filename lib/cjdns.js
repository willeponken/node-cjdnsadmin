'use strict';

var dgram = require('dgram'),
    bencode = require('bencode'),
    util = require('util'),
    crypto = require('crypto'),
    events = require('events'),
    path = require('path'),
    fs = require('fs');

var CJDNS = function (adminConfFile) {

  // Parse admin and CJDNS config
  this.parseAdminConf(adminConfFile);
  this.parseCjdnsConf(this.adminConf);
 
  // Check CJDNS config and set host, port and password 
  if(this.checkCjdnsConf()) {
    this.host = (this.cjdnsConf.admin.bind || 'localhost:11234').split(':');
    this.port = this.host[1] || '11234';
    this.host = this.host[0];
    this.password = this.cjdnsConf.admin.password;
  }

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

  this.adminConf = JSON.parse(fs.readFileSync(confFile));

  return;
};

CJDNS.prototype.parseCjdnsConf = function parseCjdnsConf (adminConf) {

  if(!adminConf.config) {
    throw 'Invalid admin configuration.';
  } else {
    this.cjdnsConf = JSON.parse(fs.readFileSync(adminConf.config));
  }

  return;
};

CJDNS.prototype.checkCjdnsConf = function() {
  var conf = this.cjdnsConf;

  // TODO: What is needed in the most minimal cjdns config?
  return conf && conf.admin.bind && conf.admin.password && conf.ipv6 && conf.publicKey && conf.privateKey;
};

CJDNS.prototype.send = function send (data, callback, optSock) {
  var msg = new Buffer(bencode.encode(data)),
      keepAlive = optSock ? true : false,
      socket = optSock || dgram.createSocket('udp4');

  socket.on('message', function (msg) {
    var resp = bencode.decode(msg, 'utf8');

    if (!keepAlive) {
      socket.close();
    }

    return callback(null, resp);
  });

  socket.on('error', function(err) {
    socket.close();
    throw 'Socket error:\n' + err.stack;
  });

  socket.send(msg, 0, msg.length, this.port, this.host, function sendResult (err, bytes) {
    if (err) {
      return callback(err);
    }
  });
};

CJDNS.prototype.sendAuth = function sendAuth (data, callback, optSock) {
  var _this = this;
  var authReq = {
    q: 'auth',
    aq: data.q
  };

  if (data.args) {
    authReq.args = data.args;
  }

  function makeHash (password, cookie, authReq) {
    var hash = password + '' + cookie,
        sha256 = crypto.createHash('sha256');

    sha256.update(hash);
    hash = sha256.digest('hex');

    authReq.hash = hash;

    hash = bencode.encode(authReq);
    sha256 = crypto.createHash('sha256');
    sha256.update(hash);

    hash = sha256.digest('hex');

    return hash;
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

  return;
};

CJDNS.prototype.availableFunctions = function availableFunctions (callback, optSock) {
  var availableFunctions = [];
  var _this = this;
  
  function getFunctions (page) {
    _this.sendAuth({
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

CJDNS.prototype.funcFactory = function funcFactory (callback, optSock) {
  var _this = this;

  // Large portion of this code is from https://github.com/cjdelisle/cjdns/blob/4fb5c1a54745474b36c54ecbd3b000171f25dbc6/contrib/nodejs/cjdnsadmin/cjdnsadmin.js
  
  function Semaphore (resourceCount) {
    var queue = [];

    function returnAfter (func) {
      var called = 0;
      return function () {
        if (called++) {
          throw new Error('Function called multiple times');
        }

        if (func) {
          func.apply(null, arguments);
        }

        resourceCount++;
        check();
      };
    };

    function check () {
      if (resourceCount < 0) {
        throw new Error('Negative resource count is impossible');
      }

      if (resourceCount === 0 || queue.length === 0) {
        return;
      }

      resourceCount--;
      queue.shift()(returnAfter);
    };

    return {
      take: function (func) {
        queue.push(func);
        check();
      }
    };
  };

  function callFunction(name, args, callback) {
    var msg = {
      q: name,
      args: {}
    };

    Object.keys(args).forEach(function (arg) {
      msg.args[arg] = args[arg];
    });

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

    var rArgs = [];

    Object.keys(params).forEach(function (name) {
      if (params[name].required === 1) {
        rArgs.push({ name: name, type: params[name].type, required: true });
      }
    });

    rArgs.sort(function (a,b) { a = a.name; b = b.name; return (a !== b) ? (a < b) ? 1 : -1 : 0 });
    var oArgs = [];

    Object.keys(params).forEach(function (name) {
      if (params[name].required === 0) {
        oArgs.push({ name: name, type: params[name].type, required: false });
      }
    });

    oArgs.sort(function (a,b) { a = a.name; b = b.name; return (a !== b) ? (a < b) ? 1 : -1 : 0 });
    rArgs.push.apply(rArgs, oArgs);

    return rArgs;
  }

  var semaphore = Semaphore(4);
  this.availableFunctions(function (err, functions) {
    if (err) {
      throw err;
    }
    var func;

    for (func in functions) {
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
/*
CJDNS.prototype.ping = function ping (callback, optSock) {
  this.send({ q: 'ping' }, function (err, msg) {
    if (msg && msg.q === 'pong') {
      return callback(null, msg.q);
    } else {
      return callback(msg, null);
    }
  }, optSock);

  return;
};

/* 
 * Admin Functions
 */
/*
CJDNS.prototype.Admin_availableFunctions = function Admin_availableFunctions (callback, optSock) {
  var availableFunctions = [];
  var _this = this;
  
  function getFunctions (page) {
    _this.sendAuth({
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
          
CJDNS.prototype.Admin_asyncEnabled = function Admin_asyncEnabled (callback, optSock) {
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
/*
CJDNS.prototype.AdminLog_subscribe = function AdminLog_subscribe (options, callback) {
  var socket = dgram.createSocket('udp4');
  var _this = this;
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
/*
  return;
};*/

module.exports = CJDNS;
