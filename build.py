#!/usr/bin/env python
import sys
import optparse

import pjs
import pjs.convert

def options():
    p = optparse.OptionParser('usage: build.py [options] main_script.py')
    p.add_option('-d','--debug', help='set the debug level', type='int', default=0,
            dest='debug')
    p.add_option('-i','--ignore-import-errors', dest='ignore_import_errors', default=False,
            action='store_true')
    opts, pos = p.parse_args()
    if len(pos) != 1:
        p.print_help()
        sys.exit(1)
    return pos, opts

if __name__ == '__main__':
    pos, opts = options()
    print pjs.convert.do_compile(pos[0], opts)
    




# vim: et sw=4 sts=4
