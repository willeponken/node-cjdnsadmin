node-cjdnsadmin (Work in Progress)
===

Abstraction of the CJDNS Admin API

## What is this?
This is a abstraction for the CJDNS Admin API for NodeJS, it's heavily copied from https://github.com/cjdelisle/cjdns/blob/master/contrib/nodejs/admin/cjdns.js but with some changes and also unit tests. 

## B-but why?
I need it for https://github.com/willeponken/hotspot and want to have seperate modules (mostly because tests using CJDNS can't be run on Travis CI).
I also want to learn all the available admin functions found in the API, and write down a documentation for them later.

##Methods

###.ping([callback])
* `callback` Function. Called when a message has been returned. Optional.

Ping the CJDNS Admin backend.

Example;

```
cjdns.ping(function(err, msg) {

  if (err) {
    console.err('Something went wrong', err);
  } else {
    console.log('Received the pong!', msg);
  }
  
});
```

###.Admin_availableFunctions([callback])
* `callback` Function. Called when the available functions has been received.

Get all the available CJDNS Admin functions.

Example;
```
cjdns.Admin_availableFunctions(function(err, functions) {

  if (err) {
    console.err('Failed to get available methods', err);
  } else {
    
    for (var func in functions) {
      console.log('Name:', functions[func].name);
      console.log(functions[func].params);
    }
  }

});
```

###.Admin_asyncEnabled([callback])
* `callback` Function.

Find out if async calls are enabled.

Example;
```
cjdns.Admin_asyncEnabled(function(err, result) {

  if (err) {
    console.err(err);
  } else if (result) {
    console.log('async is enabled');
  } else {
    console.log('async is disabled');
  }

});

```
