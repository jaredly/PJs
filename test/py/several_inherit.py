#!/usr/bin/env python

class a(object):
    def a(self):print 'a.a'

class b(object):
    def a(self):print 'b.a'

class c(object):
    def a(self):print 'c.a'

class x(a):pass
x().a()
class y(a,b):pass
y().a()
class z(a,b,c):pass
z().a()
class e(c):pass
e().a()
class f(c,b):pass
f().a()
class g(c,b,a):pass
g().a()

class a(object):
    def a(self):print 'a.a'
    def b(self):print 'a.b'
class b(object):
    def b(self):print 'b.b'
class c(a,b):pass
c().a()
c().b()
class d(b,a):pass
d().a()
d().b()

# vim: et sw=4 sts=4
