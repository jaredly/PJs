#!/usr/bin/env python

def multiline(text):
    if text is None:
        return '""';
    lines = text.split('\n')
    return ''.join("'%s\\n' +\n" % line.encode('string_escape') for line\
            in lines[:-1]) + "'%s'" % lines[-1].encode('string_escape')

def new_scope(scope):
    scope = scope.copy()
    old_locals = scope['locals']
    scope['locals'] = []
    scope['exp globals'] = []
    if scope['exp locals']:
        old_locals.insert(0, '__%d.' % scope['exp locals'])
    else:
        old_locals.insert(0, '')
    if len(old_locals) > 1:
        scope['parent locals'] = scope['parent locals'] + (tuple(old_locals), )
    return scope

import os
localfile = lambda x:os.path.join(os.path.dirname(__file__), x)
reserved_words = open(localfile('js_reserved.txt')).read().split()

reserved_words += ['js', 'py']

builtin_words = __builtins__.keys()
builtin_words += ['py', 'definedor']

def resolve(name, scope):
    if name == 'window':
        return name
    elif name == 'js':
        return name
    elif name in ('float', 'int'):
        return '$b._' + name
    elif name in reserved_words:
        raise PJsException("Sorry, '%s' is a reserved word in javascript." % name)
    elif name in scope['exp globals']:
        return '_.%s' % name
    elif name in scope['locals']:
        if scope['locals'] is scope['globals']:
            return '_.%s' % name
        elif scope['exp locals']:
            return '__%d.%s' % (len(scope['parent locals']), name)
        return name
    elif name in scope['globals']:
        return '_.%s' % name
    elif name not in scope['globals'] and name in builtin_words:
        return '$b.%s' % name
    else:
        ## for all we know, it's not defined....
        if scope['locals'] is scope['globals']:
            return '$b.assertdefined(_.%s, "%s")' % (name, name)
        elif scope['exp locals']:
            return '$b.assertdefined(__%d.%s, "%s")' % (len(scope['parent locals']), name, name)
        else:
            return '$b.assertdefined(%s || _.%s, "%s")' % (name, name, name)

def local_prefix(scope):
    if scope['globals'] is scope['locals']:
        return '_.'
    if scope['exp locals']:
        return '__%d.' % len(scope['parent locals'])
    return ''


# vim: et sw=4 sts=4
