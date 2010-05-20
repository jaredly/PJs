#!/usr/bin/env python

def a():
    print 'infunc'

def b(a,b):
    print a+b

def c(*d):
    print d,len(d)

def e(*a, **e):
    print a, e

print a.__name__,b.__name__,c.__name__,e.__name__

a()
b(3,4)
c(1,2,5,6)
a()
e(2,3,r=5)


# vim: et sw=4 sts=4
