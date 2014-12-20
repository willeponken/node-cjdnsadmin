var CJDNS = require('../lib/cjdns.js'),
    fs = require('fs'),
    assert = require('assert');

describe('cjdns', function() {
  describe('CJDNS(config)', function() {

    var cjdns;

    it('should parse config and ping admin backend', function(done) {

      cjdns = new CJDNS(process.env['HOME'] + '/.cjdnsadmin');

      //lalalala
      done();
    });
  });
});
