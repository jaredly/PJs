#!/usr/bin/env python

print 'hello'
x = [1,2,3]
for i in x:
    print i

y = range(20)
for c in y:
    print c%5

mult = [[1,2],[3,4],[5,6]]

for a,b in mult:
    print a+b

for x in range(10):
    if x>3:
        break
    print x

for a in range(20):
    if a%3==0:
        continue
    print a

r = 20
while r>0:
    print r*2
    r -= 2


# vim: et sw=4 sts=4
