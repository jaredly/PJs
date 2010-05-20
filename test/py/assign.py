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

r=[3]
r+=[1]
print r
a += 2
b /= 1
print a,b


# vim: et sw=4 sts=4
