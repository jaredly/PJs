
import re
import os

def multiline(text, convert=True):
    '''convert 'text' to a multiline string (if it contains any \\n's)
    Optionally escaping & and :'''

    if text is None:
        return '""';
    lines = text.split('\n')
    multi = (''.join("'%s\\n' +\n" % line.encode('string_escape') for line\
            in lines[:-1]) + "'%s'" % lines[-1].encode('string_escape'))
    if convert:
        multi = multi.replace('&', '&amp;').replace(':', '&coln;')
    return multi

def fix_undef(text, scope, modlevel=False):
    '''Replace special {:undef:[vbl name]} blocks with the properly scoped
    variable if it's available. Otherwise, if [modlevel], replace then mith
    $b.assertdefined()'''

    prefix = local_prefix(scope)
    for name in scope['locals']:
        text = re.sub('{:undef:' + name + ':[^:]*:}', prefix + name, text)

    if modlevel:
        text = re.sub('{:undef:(\w+):([^:]*):}', '$b.assertdefined(\\2\\1)', text)
        text = text.replace('&coln;', ':').replace('&amp;', '&')
    return text

def local_prefix(scope):
    '''Get the prefix for local variables'''

    if scope['globals'] is scope['locals']:
        return '_.'
    if scope['exp locals']:
        return '__%d.' % len(scope['parent locals'])
    return ''

def lhand_assign(name, scope):
    prefix = local_prefix(scope)
    if name in scope.locals:
        return prefix + name
    elif name in scope.explicit_globals:
        return '_.%s' % name

    if not prefix:
        prefix = 'var '
    scope.locals.append(name)
    return prefix + name

# vim: et sw=4 sts=4
