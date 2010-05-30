import glob
import os
from subprocess import Popen, PIPE

def execute(cmd):
    p = Popen(cmd, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
    out = p.stdout.read()
    err = p.stderr.read()
    return out, err



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
