#!/usr/bin/env python

a = 3
b = 3,4
print a
print b
a,b = b,a
print a
print b
c,d = [4] + [5]
print c

# tricky
a, (b,c) = 1, (2,3)
print b+c-a


# vim: et sw=4 sts=4
