#!/usr/bin/env python

a = 1

def b():
    c = 2
    def d(g):
        print g, c, a
    d(45)

b()

# vim: et sw=4 sts=4
