#!/usr/bin/env python

def decorate_me(func):
    print 'decorating', func.__name__
    def meta(*a, **b):
        print 'deca_args', a,b
        func(*a, **b)
    return meta

# vim: et sw=4 sts=4
