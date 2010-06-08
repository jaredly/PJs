#!/usr/bin/env python

class a(object):
    def a(self):print 'a.a'
    def b(self):print 'a.b'
    def c(self):print 'a.c'
    def d(self):print 'a.d'

class b(a):
    def b(self):print 'b.b'
    def c(self):print 'b.c'

class c(a):
    def d(self):print 'c.d'

class d(c, b):
    def c(self):print 'd.c'

e = d()
e.a()
e.b()
e.c()
e.d()

'''
class a(object):
    def b(self):
        print 'a.b!'

class b(a):
    def a(self):
        print 'b.a!'

    def b(self):
        print '!b.b'

class c(b):
    def c(self):
        print 'c.c!'

class d(a):
    def e(self):
        print 'e.d!'

class e(c,d):
    def e(self):
        print 'e.e'

a().b()
b().a()
b().b()
c().a()
c().b()
c().c()

e().a()
e().c()
e().e()
'''


# vim: et sw=4 sts=4
