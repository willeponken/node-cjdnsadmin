node-cjdnsadmin (Work in Progress)
===

Abstractions and native methods for the CJDNS Admin API

## What is this?
This is a abstraction for the CJDNS Admin API for NodeJS, it's heavily copied from https://github.com/cjdelisle/cjdns/blob/master/contrib/nodejs/admin/cjdns.js but with some changes and also unit tests. It'll also import all the existing native CJDNS Admin API functions. 

## B-but why?
I need it for https://github.com/willeponken/hotspot and want to have seperate modules (mostly because tests using CJDNS can't be run on Travis CI).
I also want to learn all the available admin functions found in the API, and write down a documentation for them later.

#Documentation

* [CJDNS Admin API](/doc/cjdns-admin-api.md)
* [node-cjdnsadmin](/doc/node-cjdnsadmin.md)
