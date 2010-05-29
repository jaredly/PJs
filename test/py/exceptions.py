#!/usr/bin/env python

try:
    um
    3+4+[3]
    a.b()
except TypeError, e:
    print 'yeah'
except (NotImplemented, ValueError), r:
    print 'and', r
except:
    print 'failed'

# vim: et sw=4 sts=4
