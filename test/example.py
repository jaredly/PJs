#!/usr/bin/env python

'''here's a docstring for this module
and it's multi-line'''

import toimp
import toimp
print 'example'
a='hi'
b='ho'
a='hp'
h=4
man = 1+2
man = 1+2
def foo(a,b,c=3,*rest):
    print a+b, c, h
    c=5
    def sub():
        print 'just to test'
    d=3
    sub()
    return 17

def bar(r, **man):
    print man
    print r

class Bar:
    cattr = 'something'
    def __init__(self, a, b):
        print 'args', a, b

    @staticmethod
    def staticm(one, *alls):
        print 'from static', one, alls

    def bar(self, **baz):
        print baz
assert True, 'something' + 'other thing'
[3,4,5]
print 'loaded stuff'
print __name__
if __name__ == '__main__':
    Bar(3,4).bar(a=5,c='hoo')
    Bar.staticm(5,6,7,'i');
else:
    a=2
    foo(1,2,3,4,5,6)
    bar(r=5,t='man')
    print 'notmain'


# vim: et sw=4 sts=4
