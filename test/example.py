#!/usr/bin/env python

'''here's a docstring for this module
and it's multi-line'''

import toimp
print 'example'
a='hi'
b='ho'
a='hp'
h=4
man = 1+2
man = 1+2
man.moon = 3
def foo(a,b,c=3,*rest):
    print a+b, c, h
    c=5
    def sub():
        print 'just to test'
    d=3
    return 17

class Bar(A):
    cattr = 'something'
    def __init__(self, a, b):
        print 'args', a, b

    #@staticmethod
    def static(one, *alls):
        print 'from static', one, alls

    def bar(self, **baz):
        print baz

if __name__ == '__main__':
    Bar(3,4,**b).bar(a=5,c='hoo')
    Bar.static(5,6,7,'i');
elif fail:
    pass
else:
    a=2


# vim: et sw=4 sts=4
