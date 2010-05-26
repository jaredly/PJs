#!/usr/bin/env python

b = 3
class Simple:
    a=2
    c=b
    b=4
    def man(self):
        print 'hi', self.a

class A:
    a = 2
    class B:
        a = 3
        b = 4
    b = 5

print b
print Simple.a
print Simple().man()
print Simple.b, Simple.c

print A.a
print A.b
print A.B.a, A.B.b

# vim: et sw=4 sts=4
