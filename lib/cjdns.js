'use strict';

var dgram = require('dgram'),
    bencode = require('bencode'),
    log = require('util').log,
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

  // Ping backend to test the connection
  this.ping(function pingResult(err, msg) {
    if (err) {
      throw 'Unable to ping CJDNS backend: ' + err;
    }
    return;
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

/* 
 * ABSTRACTIONS
 */

/*
 * Ping
 */
CJDNS.prototype.ping = function ping (callback) {
  this.send({ q: 'ping' }, function (err, msg) {
    if (msg && msg.q === 'pong') {
      return callback(null, msg.q);
    } else {
      return callback(msg, null);
    }
  });

  return;
};

/* 
 * Admin Functions
 */
CJDNS.prototype.Admin_availableFunctions = function Admin_availableFunctions (callback) {
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
    });
  }

  getFunctions(0);

  return;
};
          
CJDNS.prototype.Admin_asyncEnabled = function Admin_asyncEnabled (callback) {
  this.send({ q: 'Admin_asyncEnabled' }, function (err, msg) {
    if (msg.asyncEnabled === 1) {
      return callback(null, true);
    } else if (msg.asyncEnabled === 0) {
      return callback(null, false);
    } else {
      return callback(msg, null);
    }
  });

  return;
};

/*
 * AdminLog Functions
 */

/*
 * @param options An object containing { line: int, file: string, level: string }
 */
CJDNS.prototype.AdminLog_subscribe = function AdminLog_subscribe (options, callback) {
  var socket = dgram.createSocket('udp4');
  var _this = this;

  if (this.logsId) {
    this.AdminLog_unsubscribe();
  }

  if (this.logsHeartbeat) {
    clearInterval(this.logsHeartbeat);
    this.logsHeartbeat = undefined;
  }

  this.sendAuth({
    q: 'AdminLog_subscribe',
    args: options
  }, function (err, logs) {
 
   console.log('logging', err, logs) 
    _this.emit('log', err, logs);
 
  }, socket, false);

  this.logsHeartbeat = setInterval(function Heartbeat () {
  
    _this.ping(function (err, msg) {
      if (err) {
        return callback(err, null);
      }
    });
  
  }, 1000);

  return;
};

module.exports = CJDNS;
