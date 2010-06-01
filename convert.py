#!/usr/bin/env python
import sys
import optparse

import pjs
import pjs.convert

def options():
    p = optparse.OptionParser('usage: build.py [options] main_script.py [output-file]')
    p.add_option('-d','--debug', help='set the debug level', type='int', default=0,
            dest='debug')
    p.add_option('-i','--ignore-import-errors', dest='ignore_import_errors', default=False,
            action='store_true', help='Ignore import errors; only do this if you expect to handle ImportErrors in your program')
    p.add_option('-r', '--rhino', dest='rhino', action='store_true',
            help='Compile for Rhino (use load() for pjs library)')
    p.add_option('--html', dest='html', action='store_true',
            help='Override file extension; output html (default output format is .js)')
    p.add_option('-l', '--lib-dir', dest='lib_dir', default='./build',
            help='The directory (relative to output file directory) where pjslib.js\
                    can be found')

    opts, pos = p.parse_args()
    if len(pos) not in (1, 2):
        p.print_help()
        sys.exit(1)
    return pos, opts

if __name__ == '__main__':
    pos, opts = options()
    if opts.rhino and opts.html:
        print 'cannot specify both --rhino and --html'

    fmt = 'js'
    if opts.rhino:
        fmt = 'js'
    elif opts.html:
        fmt = 'html'
    elif len(pos) == 2:
        fmt = pos[1].split('.')[-1]

    if fmt not in ('html', 'js'):
        print 'Invalid format "%s". Defaulting to js' % fmt
        fmt = 'js'

    text = pjs.convert.do_compile(pos[0], fmt, vars(opts))
    if len(pos) == 2:
        open(pos[1], 'w').write(text)
    else:
        print text

# vim: et sw=4 sts=4
