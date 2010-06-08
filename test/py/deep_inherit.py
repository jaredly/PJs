#!/usr/bin/env python

class a1(object):
    def a(self):print 'a.a'
    def b(self):print 'a.b'
    def c(self):print 'a.c'
    def d(self):print 'a.d'

class a2(a1):
    pass

class a3(a2):
    pass

class b2(a1):
    def a(self):print 'b2.a'

class b3(b2):
    pass

class fin(a3, b3):pass

fin().a()


# vim: et sw=4 sts=4
