#!/usr/bin/env pyth/on

template = '''
var __builtins__ = (function(){
    var that = [];
    that['__dict__'] = that;
    that['__name__'] = '__builtins__'
    %(contents)s
})
'''

for k,v in __builtins__:
    if isintance(k, Exception):
        print 'that


# vim: et sw=4 sts=4
