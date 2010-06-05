#!/usr/bin/env python

x = js([1,2,3,4])
assert(js.x[1] == 2)
assert(x.length == 4)
assert(x.slice(0,2).length == 2)

def m(e):
    return js.e[0]
def y():return 4
z = js([m,y])

assert [m][0] == m
assert m == m
assert js.z[0].__wraps__ == m

assert js.z[0]([1]) == 1

ham = js([[1,2,3], [2,3,4]])
assert m(js.ham[0])

def a():
    def b(a):
        assert js.a[1] == 2
    return b

js.a()([1,2])

assert(js.x.slice(2).slice(0)[1] == 4)

# vim: et sw=4 sts=4
