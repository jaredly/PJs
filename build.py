#!/usr/bin/env python
import sys
import optparse

def options():
    p = optparse.OptParser('usage: build.py [options] main_script.py')
    p.add_option('-d','--debug', help='set the debug level', type='int', default=0,
            dest='debug')
    pos, opts = p.parse_opts()
    if len(pos) != 1:
        p.print_help()
        sys.exit(1)
    return pos, opts


if __name__ == '__main__':
    pos, opts = options()




# vim: et sw=4 sts=4
