var CJDNS = require('../lib/cjdns.js'),
    util = require('util'),
    fs = require('fs'),
    assert = require('assert');

describe('cjdnsadmin', function() {
  describe('CJDNS(config)', function() {

    var cjdns;

    it('should parse config and ping admin backend', function(done) {

      cjdns = new CJDNS(process.env['HOME'] + '/.cjdnsadmin');

      done();
    });
    
    describe('Abstractions', function() {
      describe('.availableFunctions(callback)', function() {
        it('should return callback with array containing available functions', function(done) {

          cjdns.availableFunctions(function(err, functions) {
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
    
      describe('.Admin_availableFunctions(callback)', function() {
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
