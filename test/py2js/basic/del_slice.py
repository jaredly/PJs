
mylist = [1,2,3,4,5]
myother = range(10)

del mylist[1:3]
del myother[[1][0]:3]
del myother[7]

for x in xrange(0,len(mylist)):
    print mylist[x]
for x in xrange(0,len(myother)):
    print myother[x]
