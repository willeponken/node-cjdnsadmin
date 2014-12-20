var dgram = require('dgram'),
    bencode = require('bencode'),
    log = require('util').log,
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
      socket = optSock || dgram.createSocket('udp4');

  socket.on('message', function (msg) {
    var resp = bencode.decode(msg, 'utf8');
    return callback(null, resp);
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
    authReq.hash = makeHash(_this.password, authReq.cookie, authReg);

    _this.send(authReq, callback, optSock);

    return;
  });

  return;
};

CJDNS.prototype.ping = function ping (callback) {
  this.send({ q: 'ping' }, function (err, msg) {
    if (msg && msg.q === 'pong') {
      return callback(null, msg);
    } else {
      return callback(msg, null);
    }
  });

  return;
};

module.exports = CJDNS;
