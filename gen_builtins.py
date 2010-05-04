#!/usr/bin/env pyth/on

for k,v in __builtins__.__dict__.iteritems():
    try:
        if issubclass(v, Exception):
            continue
    except:pass
    print '__module__.%s = __not_implemented__("%s");' % (k, k)


# vim: et sw=4 sts=4
