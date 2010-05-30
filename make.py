#!/usr/bin/env python

from pbj import Builder, cmd, PBJFailed
import os
import glob
import re

build = Builder('PJs')

def get_lineno(text):
    def meta(match):
        lno = len(text[:match.start()].split('\n'))
        return match.group()[:-1] + ' // %d :builtin:\n' % lno
    return meta

@build.file('build/pjslib.js', depends='jslib/*.js')
def jslib(name):
    files = ('jslib/functions.js', 'jslib/classes.js', 'jslib/modules.js', 'jslib/__builtin__.js')
    text = '\n'.join(open(fname).read() for fname in files)
    text = re.sub('function(\s+[$\w-]+)?\s*\(([$\w_]+,\s*)*[$\w_]*\s*\)\s*{\s*\n', get_lineno(text), text)
    if not os.path.exists('build'):
        os.mkdir('build')
    open('build/pjslib.js', 'w').write(text)

build.cmd('jstest', ('js', 'test/runtests.js'), depends='@jslib', always=True)

build.clean('build', 'test/py/*.js')

@build.target(depends='@jslib', always=True)
def pytest(one=None):
    if one is not None:
        files = [one]
    else:
        files = glob.glob('test/py/*.py')
    for fname in files:
        compare(fname)

def compare(fname):
    jsname = fname.replace('.py', '.js')
    o,e = cmd('python', fname)
    if e:
        print 'FAILED %s python error:\n%s' % (fname, e)
        return
    co, ce = cmd('./convert.py', fname, jsname, '--rhino')
    if ce:
        print 'FAILED %s conversion error:\n%s' % (fname, ce)
        return
    jo, je = cmd('js', jsname)
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
    o, e = cmd('diff', af.name, bf.name)
    os.unlink(af.name)
    os.unlink(bf.name)
    return o

if __name__ == '__main__':
    build.run()


# vim: et sw=4 sts=4
