#!/usr/bin/env python

class a:
    def b(self):
        return 5


print a
print a.b
print a().b
print type(a().b)
inst = a()
assert(a != a.b)
assert(inst != inst.b)
assert(a != inst)
assert(isinstance(inst, a))
assert(type(inst) == a)

c = js(a().b)
assert(js.c() == 5)


# vim: et sw=4 sts=4
