node-cjdnsadmin
===

##Method abstractions

###.Abs_ping([callback, optSock])
* `callback` Function. Called when a message has been returned. Optional.
* `optSock` Datagram socket. Optional.

Ping the CJDNS Admin backend.

####Example
__Code__:
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

####Example
__Code__:
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

####Example
__Code__:
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

####Example
__Code__:
```
cjdns.ping(function(err, msg) {
  
  if (err || msg !== {'q': 'pong'}) {
    console.error('Unable to ping backend', (err || msg}));
  } else {
    console.log('Success!', msg);
  }
});
```

__Data__:
```
{ q: 'pong' }
```

###.Admin_asyncEnabled(callback)
* `callback` Function.

Find out if async calls are enabled, returns object `{ 'asyncEnabled': [number] }`.

####Example
__Code__:
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

__Data__:
```
{ asyncEnabled: 1 }
```

###.Admin_availableFunctions(page, callback)
* `page` Number.
* `callback` Function.

Get all the available CJDNS Admin functions, where `page` is the page to return.

####Example
__Code__:
```
cjdns.Admin_availableFunctions(0, functions(err, functions) {
  functions = functions.availableFunctions;

  if (err) {
    throw err;
  }

  for (var func in functions) {
    console.log(functions[func]);
  }
});
```

__Data__:
```
{ availableFunctions: 
   { AdminLog_logMany: { count: { required: 1, type: 'Int' } },
     AdminLog_subscribe: 
      { file: { required: 0, type: 'String' },
        level: { required: 0, type: 'String' },
        line: { required: 0, type: 'Int' } },
     AdminLog_subscriptions: {},
     AdminLog_unsubscribe: { streamId: { required: 1, type: 'String' } },
     Admin_asyncEnabled: {},
     Admin_availableFunctions: { page: { required: 0, type: 'Int' } },
     InterfaceController_disconnectPeer: { pubkey: { required: 1, type: 'String' } },
     InterfaceController_peerStats: { page: { required: 0, type: 'Int' } } },
  more: 1 }
```

###.Allocator_bytesAllocated(callback)
* `callback` Function.

Get the number of bytes that is allocated by CJDNS, returns object `{ 'bytes': [number] }`.

####Example
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

####Example
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

####Example
```
cjdns.AuthorizedPasswords_add('willeponken', 'qwertasdfgzxcvbn123');
```

###.AuthorizedPasswords_list(callback)
* `callback` Function. Optional.

Get a list of all authorized users.

####Example
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

####Example
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

###.Core_exit([callback])
* `callback` Function. Optional.

__Notice:__ This one is not enabled in the unit test because it... You know, exits CJDNS.

Stop CJDNS core.

####Example
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

###.Core_initTunnel(desiredTunName, [callback])
* `desiredTunName` String. Set to 0 to let kernel decide.
* `callback` Function. Optional.

__Notice:__ This functions is probably deprecated (does not work, atleast for me). See unit test (`/test/cjdns.js`) and uncomment if you want to test it for yourself.

Set up TUN device using the same function as CJDNS uses during startup.

####Example
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

###.Core_pid(callback)
* `callback` Function.

Get PID of the CJDNS core process.

####Example
```
cjdns.Core_pid(function (err, pid) {
  if (err) {
    throw err;
  }

  pid = pid.pid;
  console.log('PID is', pid);
});
```

###.ETHInterface_beacon(interfaceNumber, state [callback])
* `interfaceNumber` Number. Default 0 to receive current state.
* `state` Number. Optional. Set to 0-2 to change to desired beacon mode.
* `callback` Function. Optional.

Get state of beacon mode, or change it.

####Example
```

// Get current beacon mode
cjdns.ETHInterface_beacon(0, function(err, msg) {
  if (err) {
    throw err;
  }

  console.log('The current state state is', msg.state);
});

// Change beacon mode to 2
cjdns.ETHInterface_beacon(0, 2);
```

###.ETHInterface_beginConnection(pubKey, macAddress, interfaceNumber, password, [callback])
* `pubKey` String.
* `macAddress` String.
* `interfaceNumber` Number.
* `password` String.
* `callback` Function. Optional.

Connect an ETHInterface to another computer which has an ETHInterface running.

####Example
```
cjdns.ETHInterface_beginConnection('pubKey', 'ab:cd:ef:12:34:45', 0, 'asdfzxcvbn1234', function(err, msg) {
  if (err) {
    throw err;
  }

  console.log(msg);
});
```

###.ETHInterface_new(bindDevice, [callback])
* `bindDevice` String.
* `callback` Function. Optional.

__Notice:__ You'll need to run this as root or else it'll faild with "'error': 'call to socket() failed. [permission denied]'".

Create a new ETHInterface and bind it to a device.

####Example
```
cjdns.ETHInterface_new('eth0', function(err, msg) {
  if (err) {
    throw err;
  }

  console.log(msg);
});
```

###.InterfaceController_disconnectPeer(pubKey, [callback])
* `pubKey` String.
* `callback` Function. Optional.

Disconnect a peer by public key.

####Example
```
cjdns.InterfaceController_disconnectPeer('pubKey');
```

###.InterfaceController_peerStats(page, callback)
* `page` Number.
* `callback` Function.

Get peer stats.

####Example
```
cjdns.InterfaceControler_peerStats(0, function(err, stats) {
  if (err) {
    throw err;
  }

  console.log(stats.peers);
});
```

###.IpTunnel_allowConnection(pubKeyOfAuthorizedNode, ip6Prefix, ip6Address, [callback])
* `pubKeyOfAuthorizedNode` String.
* `ip6Prefix` Number.
* `ip6Address` String.
* `callback` Function. Optional.

Allow incommming connection from another node.

####Example
__Code__:
```
cjdns.IpTunnel_allowConnection('pubKey', 54', '::1');
```

__Data__:
```
{ error: 'none' }
```

###.IpTunnel_connectTo(publicKeyOfNodeToConnectTo, [callback])
* `publicKeyOfNodeToConnectTo` String.
* `callback` Function. Optional.

Initiate an outgoing connection to another node and request IP addresses from them.

####Example
__Code__:
```
cjdns.IpTunnel_connectTo('pubKey');
```

__Data__:
```
{ error: 'none' }
```

###.IpTunnel_listConnections(callback)
* `callback` Function.

List IP tunnel connections.

####Example
__Code__:
```
cjdns.IpTunnel_listConnections(function(err, connections) {
  if (err) {
    throw err;
  }

  connections = connections.connections;
  console.log('IP tunnel connections', connections);
});
```

__Data__:
```
{ error: 'not implemented' }
```

###.IpTunnel_removeConnection(connection, [callback])
* `connection` Number.
* `callback` Function. Optional.

__Notice:__ NOT IMPLEMENTED

Remove IP tunnel connection based on connection number, which can be obtained from `IpTunnel_listConnections()`.

#####Example
__Code__:
```
cjdns.IpTunnel_removeConnection(0, function(err, msg) {
  if (err) {
    throw err;
  }

  console.log(msg.error); // msg.error == 'not implemented'
});
```

__Data__:
```
{ error: 'not implemented' }
```

###.IpTunnel_showConnection(connection, [callback])
* `connection` Number.
* `callback` Function. Optional.

__Notice:__ NOT IMPLEMENTED

Show IP tunnel connection based on connection number, which can be obtained from `IpTunnel_listConnections()`.

####Example
__Code__:
```
cjdns.IpTunnel_showConnection(0, function(err, msg) {
  if (err) {
    throw err;
  }

  console.log(msg.error); // msg.error == 'not implemented'
});
```

__Data__:
```
{ error: 'not implemented' }
```

###.NodeStore_dumpTable(page, callback)
* `page` Number.
* `callback` Function.

Get a dump of CJDNS' NodeStore table.

####Example
__Code__:
```
cjdns.NodeStore_dumpTable(0, function(err, table) {
  if (err) {
    throw err;
  }

  console.log(table);
});
```

__Data__:
```
{ count: 129,
  more: 1,
  peers: 1,
  routingTable: 
   [ { ip: 'fc4f:c18d:61d0:14da:0d8d:55c4:e5f3:f961',
       link: 14976923,
       path: '0000.0000.05ef.1233',
       time: 120300,
       version: 12 },
     { ip: 'fc20:b010:9c58:8881:0cf6:7bcb:e034:8f78',
       link: 14375909,
       path: '0000.0000.066f.1233',
       time: 205125,
       version: 12 },
     { ip: 'fc56:8313:1e14:1a50:0c01:0850:a53e:7127',
       link: 34412253,
       path: '0000.0000.0000.9a33',
       time: 159315,
       version: 12 },
     { ip: 'fcd1:ea5d:24e5:cc7a:0ada:8d93:ebf7:22b7',
       link: 9968420,
       path: '0000.0000.0063.1233',
       time: 111384,
       version: 13 },
     { ip: 'fc87:5019:8605:51f6:09ed:14d1:19b8:05c6',
       link: 22677742,
       path: '0000.0002.4e4a.9a33',
       time: 98821,
       version: 12 },
     { ip: 'fc29:0895:df9f:cbf1:06ee:1750:8921:4704',
       link: 20449584,
       path: '0000.0000.0009.ae33',
       time: 35742,
       version: 13 },
     { ip: 'fc24:7863:1f09:b03c:03fd:a861:96e8:038b',
       link: 20277495,
       path: '0000.0133.4299.2e33',
       time: 126339,
       version: 13 },
     { ip: 'fc4c:6906:317e:d158:015e:e0f5:21be:e382',
       link: 16102375,
       path: '0000.986e.c299.2e33',
       time: 144392,
       version: 13 } ] }
```

###.NodeStore_nodeForAddr(ip, callback)
* `ip` String.
* `callback` Function.

Takes the IP for a node and returns information about that node.

####Example
__Code__:
```
cjdns.NodeStore_nodeForAddr('fc74:73e8:3913:f15b:d463:2fe7:db69:381e', function(err, data) {
  if (err) {
    throw err;
  }

  if (data.error === 'none') {
    console.log(data.result);
  } else {
    console.warn('Unable to find IP');
  }
});
```

__Data__:
```
{ error: 'none',
  result: 
   { bestParent: 
      { ip: 'fc74:73e8:3913:f15b:d463:2fe7:db69:381e',
        parentChildLabel: '0000.0000.0000.0001' },
     encodingScheme: [ [Object], [Object], [Object] ],
     key: 'mh9sdvb6jv69x76y21kk5vp0n5dmtrtxl6zl7dck1ywcq2c49xn0.k',
     linkCount: 3,
     protocolVersion: 12,
     reach: 4294967295,
     routeLabel: '0000.0000.0000.0001' } }
```
