#!/usr/bin/env python

def a():
    print 'infunc'

def b(a,b):
    print a+b

def c(*d):
    print d,len(d)

def e(*a, **e):
    print a, e

print a.__name__, b.__name__, c.__name__, e.__name__

a()
b(3,4)
c(1,2,5,6)
a()
e(2,3,r=5)

def defaults(man='me'):
    print man, 7

defaults()
defaults(89)

def everything(a, b=2, *c, **d):
    print a, b
    print c, d

everything(2,3,4)
everything('ho')
everything(1, one=2)
everything(4,5,6,7,8,y=3)

# vim: et sw=4 sts=4
