var CJDNS = require('../lib/cjdns.js'),
    fs = require('fs'),
    assert = require('assert');

describe('cjdns', function() {
  describe('CJDNS(config)', function() {

    var cjdns;

    it('should parse config and ping admin backend', function(done) {

      cjdns = new CJDNS(process.env['HOME'] + '/.cjdnsadmin');

      done();
    });

    describe('.ping(callback)', function() {
      it('should ping admin backend and return "pong"', function(done) {

        cjdns.ping(function(err, msg) {
          assert.ifError(err); 
          assert.equal(msg, 'pong');
          
          done();
        });
      });
    });
    
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
    });
  });
});
