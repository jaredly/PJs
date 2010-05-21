#!/usr/bin/env python

x = 3

def a():
    x = 4
    print x

def b():
    global x
    x = 5

print x
a()
print x
b()
print x


# vim: et sw=4 sts=4
