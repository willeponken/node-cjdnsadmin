'use strict';

// https://github.com/cjdelisle/cjdns/blob/4fb5c1a54745474b36c54ecbd3b000171f25dbc6/node_build/Semaphore.js

var Semaphore = function Semaphore (resourceCount) {
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

module.exports = Semaphore;
