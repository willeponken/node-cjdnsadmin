var CJDNS = require('../lib/cjdns.js'),
    util = require('util'),
    fs = require('fs'),
    assert = require('assert');

describe('cjdnsadmin', function() {
  describe('CJDNS(config)', function() {

    var cjdns;

    it('should parse config and ping admin backend', function() {

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
            assert.ifError(err); 
            assert.equal(msg.q, 'pong');
            
            done();
          });
        });
      });
      
      describe('.Admin_asyncEnabled(callback)', function() {
        it('should return callback with info if async communication is enabled or not', function(done) {

          cjdns.Admin_asyncEnabled(function(err, msg) {
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

      describe('.NodeStore_dumpTable(page, callback)', function() {
        it('should take page and return callback with NodeStore table as an object', function(done) {

            cjdns.NodeStore_dumpTable(0, function (err, table) {
              assert.ifError(err);
              assert.equal(typeof table, 'object');
              
              done()
            });
        });
      });
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
