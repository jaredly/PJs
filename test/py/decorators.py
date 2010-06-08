#!/usr/bin/env python

def decorate_me(func):
    print 'decorating'
    def meta(*a, **b):
        print 'deca_args', len(a)
        func(*a, **b)
    return meta

@decorate_me
def hello(a,b):
    print a+b

hello(3,5)

class Cls:
    @decorate_me
    def hello(self, a,b):
        print a - b

Cls().hello(4,5)

# vim: et sw=4 sts=4
