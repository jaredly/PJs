#!/usr/bin/env python

d = {}
d[2] = 3
d['a'] = 'b'
d[2], d['a'] = d['a'], d[2]
print d[2]
print 2 in d
print 'a' in d
print d.has_key(7)
print d.has_key('a')

# vim: et sw=4 sts=4
