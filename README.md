node-cjdnsadmin (Work in Progress)
===

Abstraction of the CJDNS Admin API

## What is this?
This is a abstraction for the CJDNS Admin API for NodeJS, it's heavily copied from https://github.com/cjdelisle/cjdns/blob/master/contrib/nodejs/admin/cjdns.js but with some changes and also unit tests. 

## B-but why?
I need it for https://github.com/willeponken/hotspot and want to have seperate modules (mostly because tests using CJDNS can't be run on Travis CI).
I also want to learn all the available admin functions found in the API, and write down a documentation for them later.

#Documentation

##Method abstractions

###.Abs_ping([callback, optSock])
* `callback` Function. Called when a message has been returned. Optional.
* `optSock` Datagram socket. Optional.

Ping the CJDNS Admin backend.

Example;

```
cjdns.Abs_ping(function(err, result) {

  if (err || !result) {
    console.error('Something went wrong', (err || result));
  } else {
    console.log('Received the pong!');
  }
  
});
```

###.Abs_availableFunctions(callback, [optSock])
* `callback` Function. Called when the available functions has been received.
* `optSock` Datagram socket. Optional.

Get all the available CJDNS Admin functions.

Example;
```
cjdns.Abs_availableFunctions(function(err, functions) {

  if (err) {
    console.error('Failed to get available methods', err);
  } else {
    
    for (var func in functions) {
      console.log('Name:', functions[func].name);
      console.log(functions[func].params);
    }
  }

});
```

###.Abs_asyncEnabled(callback, [optSock])
* `callback` Function.
* `optSock` Datagram socket. Optional.

Find out if async calls are enabled.

Example;
```
cjdns.Abs_asyncEnabled(function(err, result) {

  if (err) {
    console.error('Oh noes!', err);
  } else if (result) {
    console.log('async is enabled');
  } else {
    console.log('async is disabled');
  }

});
```

##Native methods

###.ping([callback])
* `callback` Function. Optional.

Ping the CJDNS Admin backend, returns `{ 'q': 'pong' }` on success.

Example;
```
cjdns.ping(function(err, msg) {
  
  if (err || msg !== {'q': 'pong'}) {
    console.error('Unable to ping backend', (err || msg}));
  } else {
    console.log('Success!', msg);
  }
});
```

###.Admin_asyncEnabled(callback)
* `callback` Function.

Find out if async calls are enabled, returns object `{ 'asyncEnabled': [number] }`.

Example;
```
cjdns.Admin_asyncEnabled(function(err, msg) {
  
  if (err) {
    console.error('Oh noes, something went wrong', err);
  } else if (msg.asyncEnabled === 1) {
    console.log('Async calls are enabled');
  } else {
    console.warn('Async calls are not enabled');
  }
});
```

###.Admin_availableFunctions(page)
* `page` Number.
* `callback` Function.

Get all the available CJDNS Admin functions, where `page` is the page to return.

Example;
```
cjdns.Admin_availableFunctions(0, functions(err, functions) {

  if (err) {
    throw err;
  }

  for (var func in functions) {
    console.log(functions[func]);
  }
});
```

###.Allocator_bytesAllocated(callback)
* `callback` Function.

Get the number of bytes that is allocated by CJDNS, returns object `{ 'bytes': [number] }`.

Example;
```
cjdns.Allocator_bytesAllocated(function(err, bytes) {
  bytes = bytes.bytes;

  if (err) {
    throw err;
  }

  console.log('There is', bytes, 'allocated');
});
```

###.Allocator_snapshot(includeAllocations, [callback]
* `callback` Function. Optional.

Dump CJDNS' memory snapshot to stderr.

Example;
```
cjdns.Allocator_snapshot(0);
```

###.AuthorizedPasswords_add(user, password, [authType, ipv6, callback])
* `user` String.
* `password` String.
* `authType` String. Optional.
* `ipv6` String. Optional.
* `callback` Function. Optional.

Add a new user to authorized passwords.

Example;
```
cjdns.AuthorizedPasswords_add('willeponken', 'qwertasdfgzxcvbn123');
```

###.AuthorizedPasswords_list(callback)
* `callback` Function. Optional.

Get a list of all authorized users.

Example;
```
cjdns.AuthorizedPasswords_list(function(err, users) {
  if (err) {
    throw err;
  }

  console.log('There are', users.total, 'authorized users');

  users = users.users;
  users.forEach(function(user) {
    console.log(users[user]);
  });
}
```

###.AuthorizedPasswords_remove(user, [callback])
* `user` String.
* `callback` Function. Optional.

Remove a user from the authorized passwords.

Example;
```
cjdns.AuthorizedPasswords_remove('willeponken', function(err, msg) {
  if (err) {
    console.error('Failed to remove user', err);
  }

  if (msg.error !== 'none') {
    console.error('Failed to rmeove user', msg.error);
  }
});
```
###.NodeStore_dumpTable(page, callback)
* `page` Number.
* `callback` Function.

Get a dump of CJDNS' NodeStore table.

Example;
```
cjdns.NodeStore_dumpTable(0, function(err, table) {
  if (err) {
    throw err;
  }

  console.log(table);
});
```

###.Core_exit([callback])
* `callback` Function. Optional.

__Notice:__ This one is not enabled in the unit test because it... You know, exits CJDNS.

Stop CJDNS core.

Example;
```
cjdns.Core_exit(function(err, result) {
  if (err) {
    throw err;
  }

  if (result.error === 'none') {
    console.log('Exited the CJDNS core');
  } else {
    console.error('Failed to exit', result.error);
  }
});
```

###.Core.initTunnel(desiredTunName, [callback])
* `desiredTunName` String. Set to 0 to let kernel decide.
* `callback` Function. Optional.

__Notice:__ This functions is probably deprecated (does not work, atleast for me). See unit test (`/test/cjdns.js`) and uncomment if you want to test it for yourself.

Set up TUN device using the same function as CJDNS uses during startup.

Example;
```
cjdns.Core_initTunnel('cjdnsadmin', function(err, result) {
  if (err) {
    throw err;
  }

  if (result.error === 'none') {
    console.log('Successfully set up TUN device');
  } else {
    console.error('Oh snap! Failed to set up TUN');
  }
});
```
