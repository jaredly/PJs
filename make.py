#!/usr/bin/env python

from pbj import Builder, cmd, PBJFailed
import os

build = Builder('PJs')

@build.file('build/pjslib.js', depends='jslib/*.js')
def jslib(name):
    text, err = cmd('cat jslib/*.js')
    if err:
        print err
        raise PBJFailed
    if not os.path.exists('build'):
        os.mkdir('build')
    open('build/pjslib.js', 'w').write(text)

build.cmd('jstest', 'js test/runtests.js')

build.clean('build', 'test/py/*.js')

if __name__ == '__main__':
    build.run()


# vim: et sw=4 sts=4
