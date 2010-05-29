#!/usr/bin/env python

import glob
import os
from subprocess import Popen, PIPE

def execute(cmd):
    p = Popen(cmd, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
    out = p.stdout.read()
    err = p.stderr.read()
    return out, err

def compare(fname):
    jsname = fname.replace('.py', '.js')
    o,e = execute(['python', fname])
    if e:
        print 'FAILED %s python error:\n%s' % (fname, e)
        return
    co, ce = execute(['./convert.py', fname, jsname, '--rhino'])
    if ce:
        print 'FAILED %s conversion error:\n%s' % (fname, ce)
        return
    jo, je = execute(['js', jsname])
    if je:
        print 'FAILED %s javascript error:\n%s' % (fname, je)
        print jo
        return
    if o != jo:
        print 'FAILED %s different output:\n' % fname
        print diff(o, jo)
        return
    print 'PASSED %s' % fname
    os.unlink(jsname)

from tempfile import NamedTemporaryFile as ntf

def diff(a, b):
    af = ntf(delete=False)
    af.write(a)
    af.close()
    bf = ntf(delete=False)
    bf.write(b)
    bf.close()
    o, e = execute(['diff', af.name, bf.name])
    os.unlink(af.name)
    os.unlink(bf.name)
    return o


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        files = sys.argv[1:]
    else:
        files = glob.glob('test/py/*.py')
    execute(['make', 'jslib'])
    for fname in files:
        compare(fname)



# vim: et sw=4 sts=4
