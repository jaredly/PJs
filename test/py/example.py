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
man = 1+2, ['a', 'list'], {'a':'dict'+' yeah', 3:4}
try:
    um
    3+4+[3];
    a.b();
except TypeError, e:
    print 'yeah'
except (NotImplemented, ValueError), r:
    print 'and', r
except:
    print 'failed'
print man
def foo(a,b,c=3,*rest):
    print a+b, c
    c=5
    def sub():
        print 'just to test'
    d=3
    sub()
    return 17

def bar(r, **man):
    print man
    print r

def decorate_me(func):
    print 'decorating',func.__name__
    def meta(*a, **b):
        print 'deca_args', a,b
        func(*a, **b)
    return meta

class Bar:
    cattr = 'something'
    def __init__(self, a, b):
        print 'args', a, b

    @staticmethod
    def staticm(one, *alls):
        print 'from static', one, alls

    def bar(self, **baz):
        print 'bar_bar', baz

    def __str__(self):
        return '<Bar inst>'

    def __repr__(self):
        return str(self)

    bar = decorate_me(bar)
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
