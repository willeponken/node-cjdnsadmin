var CJDNS = require('../lib/cjdns.js'),
    util = require('util'),
    fs = require('fs'),
    util = require('util'),
    assert = require('assert');

describe('cjdnsadmin', function() {
  describe('CJDNS(config)', function() {

    var cjdns;

    it('should parse config and create native methods from available CJDNS functions', function() {

      cjdns = new CJDNS(process.env['HOME'] + '/.cjdnsadmin');
    });

    describe('Abstractions', function() {
      describe('.Abs_availableFunctions(callback)', function() {
        it('should return callback with array containing available functions', function(done) {

          cjdns.Abs_availableFunctions(function(err, functions) {
            assert.ifError(err);
            assert.equal(typeof functions, 'object');

            var funcLen = functions.length;
            for (var func = 0; func < funcLen; func++) {
              assert.equal(typeof functions[func].name, 'string');
              assert.equal(typeof functions[func].params, 'object');
            }

            done();
          });
        });
      });
      
      describe('.Abs_ping(callback)', function() {
        it('should return callback with ping result, true for success and false for failure', function(done) {

          cjdns.Abs_ping(function(err, result) {
            assert.ifError(err);
            assert.equal(typeof result, 'boolean');

            done();
          });
        });
      });
    });

    describe('Native', function() {
      describe('.ping(callback)', function() {
        it('should ping admin backend and return {"q": "pong"}', function(done) {

          cjdns.ping(function(err, msg) {
            //console.log(msg);
            assert.ifError(err); 
            assert.equal(msg.q, 'pong');
            
            done();
          });
        });
      });
      
      describe('.Admin_asyncEnabled(callback)', function() {
        it('should return callback with info if async communication is enabled or not', function(done) {

          cjdns.Admin_asyncEnabled(function(err, msg) {
            //console.log(msg);

            assert.ifError(err); 

            if (msg.asyncEnabled === 0 || msg.asyncEnabled === 1) {
              done();
            } else {
              throw 'Wrong result ' + msg.asyncEnabled;
            }
          });
        });
      });
    
      describe('.Admin_availableFunctions(page, callback)', function() {
        it('should return callback with array containing available functions', function(done) {

          cjdns.Admin_availableFunctions(0, function(err, functions) {
            //console.log(util.inspect(functions, { showHidden: true, depth: null }));
            
            functions = functions.availableFunctions;
            assert.ifError(err);
            assert.equal(typeof functions, 'object');

            for (var func in functions) {
              assert.equal(typeof functions[func], 'object');
            }

            done();
          });
        });
      });

      describe('.Allocator_bytesAllocated(callback)', function() {
        it('should return callback with { bytes: [number] }, where [number] is the bytes allocated', function(done) {

          cjdns.Allocator_bytesAllocated(function (err, bytes) {
            bytes = bytes.bytes;

            assert.ifError(err);
            assert.equal(typeof bytes, 'number');

            done()
          });
        });
      });

      describe('.Allocator_snapshot(includeAllocations, callback)', function() {
        it('should return callback with memory tree dump', function(done) {

          cjdns.Allocator_snapshot(1, function (err, snapshot) {

            assert.ifError(err);
            assert.equal(snapshot.error, 'none');

            done()
          });
        });
      });

      describe('.AuthorizedPasswords_add(user, password, [authType, ipv6, callback])', function() {
        it('should add a new authorized password and return callback', function(done) {

          cjdns.AuthorizedPasswords_add('test', 'test1test2test3test4', undefined, undefined, function (err, msg) {

            assert.ifError(err);
            assert.equal(typeof msg, 'object');

            done()
          });
        });
      });
      
      describe('.AuthorizedPasswords_list(callback)', function() {
        it('should return callback with a list of authorized users', function(done) {

          cjdns.AuthorizedPasswords_list(function (err, users) {
            assert.ifError(err);
            
            users = users.users;
            assert.notEqual(users.indexOf('test'), -1);
            
            done()
          });
        });
      });
      
      describe('.AuthorizedPasswords_remove(user, [callback])', function() {
        it('should remove an user from authorized passwords and return callback with status', function(done) {

          cjdns.AuthorizedPasswords_remove('test', function (err, msg) {

            assert.ifError(err);
            assert.equal(msg.error, 'none');
            
            done()
          });
        });
      });
     
      // I probably need to implement some kind of "start CJDNS method before testing this.
      /* 
      describe('.Core_exit(callback)', function() {
        it('should stop CJDNS and return callback with status', function(done) {

          cjdns.Core_exit(function (err, result) {
            assert.ifError(err);
            assert.equal(result.error, 'none');
            
            done()
          });
        });
      });
      */

      // Is this one deprecated (I don't get it to work)? The documentation says:
      // This function is used during cjdns startup to initialize the TUN device, set it's IP address and set the MTU, ***it is hastily designed and may be removed in the future.***
      /*
      describe('.Core_initTunnel(desiredTunName, callback)', function() {
        it('should setup a TUN device', function(done) {

          cjdns.Core_initTunnel('cjdnsadmin', function (err, result) {
            assert.ifError(err);
            assert.equal(result.error, 'none');
            
            done()
          });
        });
      });
      */
      
      describe('.Core_pid(callback)', function() {
        it('should return the PID of the CJDNS core process', function(done) {

          cjdns.Core_pid(function (err, pid) {

            assert.ifError(err);
            assert.equal(typeof pid.pid, 'number');
            
            done()
          });
        });
      });
      
      describe('.ETHInterface_beacon(interfaceNumber, state, callback)', function() {
        it('should enable sending or receiving of ETHInterface beacon messages', function(done) {

          var beacon;

          // Get the current beacon state
          cjdns.ETHInterface_beacon(0, function(err, msg) {
            assert.ifError(err);
            assert.equal(msg.error, 'none');

            beacon = msg.state;
          
            // Change the beacon state to 2
            cjdns.ETHInterface_beacon(2, 0, function (err, msg) {

              assert.ifError(err);
              assert.equal(msg.error, 'none');
              assert.equal(msg.state, 2);

              // If the beacon state isnt the same as before, reset it to original state
              if (msg.state !== beacon) {
                cjdns.ETHInterface_beacon(beacon, 0, function(err, msg) {
                  assert.ifError(err);
                  assert.equal(msg.error, 'none');
                  assert.equal(msg.state, beacon);
                  
                  done()
                });
              }
            });
          });

        });
      });

      // This one is pretty much untestable, feel free to uncomment and populate with correct parameters
      /*
      describe('.ETHInterface_beginConnection(publicKey, macAddress, interfaceNumber, password,  callback)', function() {
        it('should connect an ETHInterface to another computer which has an ETHInterface running', function(done) {

          cjdns.ETHInterface_beginConnection('pubKey', 'macAddress', 'interfaceNumber', 'password', function(err, msg) {
            assert.ifError(err);
            assert.equal(msg.error, 'none');
          });
        });
      });
      */

      // Yet another untestable one, feel free to uncomment and edit interface to the correct one. You'll need to
      // run this as root or else it'll fail with "'error': 'call to socket() failed. [permission denied]'"
      /*
      describe('.ETHInterface_new(bindDevice, callback)', function() {
        it('should create a new ETHInterface and bind it to a device', function(done) {

          cjdns.ETHInterface_new('eth0', function(err, msg) {
            assert.ifError(err);
            assert.equal(typeof msg.interfaceNumber, 'number');
          });
        });
      });
      */

      describe('.InterfaceController_disconnectPeer(pubKey, callback)', function() {
        it('should disconnect a peer by public key', function(done) {

          cjdns.InterfaceController_disconnectPeer('pubKey', function (err, msg) {
            assert.ifError(err);
            assert.equal(msg.error, 'bad key'); // Well, atleast it connectected to the CJDNS admin backend?
                                                // You could change this to a real pubkey, and change 'bad key' to 'none',
                                                // to test if it REALLY works.
            
            done()
          });
        });
      });

      describe('.InterfaceController_peerStats(page, callback)', function() {
        it('should take page and return peer stats in callback', function(done) {

          cjdns.InterfaceController_peerStats(0, function (err, stats) {
            assert.ifError(err);
            assert.equal(typeof stats.peers, 'object');
            
            done()
          });
        });
      });
      
      describe('.IpTunnel_allowConnection(publicKeyOfAuthorizedNode, ip6Prefix, ip6Address, callback)', function() {
        it('should allow incomming connection from another node', function(done) {

          cjdns.IpTunnel_allowConnection('pubKey', 54, 'ip6Address', function (err, msg) {
            assert.ifError(err);
            assert.equal(msg.error, 'key must be 52 characters long'); // Successfully talked to the CJDNS admin backend,
                                                                       // Replace 'pukKey' with a correct one and also
                                                                       // change ip6Prefix and ip6Address as it fits if
                                                                       // you want to test the rest.
            
            done()
          });
        });
      });
      
      describe('.IpTunnel_connectTo(publicKeyOfNodeToConnectTo, callback)', function() {
        it('should Initiate an outgoing connection to another node and request IP addresses from them', function(done) {

          cjdns.IpTunnel_connectTo('pubKey', function (err, msg) {
            assert.ifError(err);
            assert.equal(msg.error, 'key must be 52 characters long'); // Successfully talked to the CJDNS admin backend,
                                                                       // Replace 'pukKey' with a correct one if you want 
                                                                       // to test the rest.
            
            done()
          });
        });
      });
      
      describe('.IpTunnel_listConnections(callback)', function() {
        it('should list iptunnel connections', function(done) {

          cjdns.IpTunnel_listConnections(function (err, msg) {
            assert.ifError(err);
            assert.equal(typeof msg.connections, 'object');

            done()
          });
        });
      });
      
      describe('.IpTunnel_removeConnection(connection, callback)', function() {
        it('should remove iptunnel connection based on connection number (NOT IMPLEMENTED)', function(done) {

          cjdns.IpTunnel_removeConnection(2147483647, function (err, msg) { // Hopefully you don't have that many connections
            assert.ifError(err);
            assert.equal(msg.error, 'not implemented'); // As of now, this functions is not implemented 

            done()
          });
        });
      });
      
      describe('.IpTunnel_showConnection(connection, callback)', function() {
        it('should show iptunnel connection based on connection number (NOT IMPLEMENTED)', function(done) {

          cjdns.IpTunnel_removeConnection(0, function (err, msg) {
            assert.ifError(err);
            assert.equal(msg.error, 'not implemented'); // As of now, this functions is not implemented 

            done()
          });
        });
      });

      describe('.NodeStore_dumpTable(page, callback)', function() {
        it('should take page and return callback with NodeStore table as an object', function(done) {

          cjdns.NodeStore_dumpTable(0, function (err, table) {
            assert.ifError(err);
            assert.equal(typeof table, 'object');
            
            done()
          });
        });
      });
     
      // You'll need to have the specified address in your NodeStore table to find it's pubkey, uncomment and replace with
      // your own if you want to test this function.
      /*
      describe('.NodeStore_nodeForAddr(ip, callback)', function() {
        it('should take ip (from cjdns) and return callback with pubkey for specified address', function(done) {

          cjdns.NodeStore_nodeForAddr('fc15:491b:549:9d8a:8480:45f8:bd10:a53e', function (err, data) {
            assert.ifError(err);
            assert.equal(data.error, 'none');
            assert.equal(typeof data.result, 'object');
            
            done()
          });
        });
      });
      */
    });

    /* 
    describe('.Admin_asyncEnabled(callback)', function() {
      it('should return callback with info if async communication is enabled or not', function(done) {

        cjdns.Admin_asyncEnabled(function(err, result) {
          assert.ifError(err); 

          if (!result === (false || true)) {
            throw 'Wrong result ' + result;
          }

          done();
        });
      });
    });
    
    describe('.Admin_availableFunctions(callback)', function() {
      it('should return callback with array containing available functions', function(done) {

        cjdns.Admin_availableFunctions(function(err, functions) {
          assert.ifError(err);
          assert.equal(typeof functions, 'object');

          for (var func in functions) {
            assert.equal(typeof functions[func].name, 'string');
            assert.equal(typeof functions[func].params, 'object');
          }

          done();
        });
      });
    });
   
    describe('.AdminLog_subscribe(options, callback, optSock)', function() {
      it('should something', function(done) {
        
        cjdns.AdminLog_subscribe({}, function(err) {
          throw err;
        });
        
        cjdns.on('log', function(err, logs) {
          console.log(err, logs);
        });

      });
    });*/
  });
});
