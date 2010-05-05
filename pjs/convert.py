#!/usr/bin/env python

import ast

class PJsException(Exception):pass

TEMPLATES = {
    'module':'''\
module('%(filename)s, function (%(scope)s) {
    %(scope)s.__doc__ = %(docs);
%(contents)s
});
''',
    'class':'''\
%(left)s = class(%(name)s, [%(bases)s], (function(){
    var __locals__ = {};
%(contents)s
    return __locals__;
}()));
''',
    'function':'''\
%(left)s = $m(%(special)sfunction %(name)s(%(args)s) {
%(contents)s
});
''',
    'if':'''\
if (%(test)s) {
%(contents)s
}%(more)s
''',
}

def convert_modules(filename):
    '''
    a function to cunvert python to javascript. uses python's ``ast`` module.
    returns (imports, js)

    - imports is a list of modules to be imported
    - js is text of the converted javascript code
    '''
    modules = {}
    toimport = [filename]
    while len(toimport):
        fname = toimport.pop()
        text = open(filename).read()
        tree = ast.parse(text, fname)
        js, imports = convert_module(tree, fname)
        toimport += imports
        modules[fname] = js

    return modules

def multiline(text):
    lines = text.split('\n')
    return ''.join("'%s\\n' +\n" % line.encode('string_escape') for line\
            in lines[:-1]) + "'%s'" % lines[-1].encode('string_escape')

def convert_module(mod, filename):
    scope = '__globals__'
    dct = {'scope':scope, 'filename':filename}
    dct['doc'] = multiline(ast.get_docstring(mod))

    _globs = []
    scope = (_globs, _globs, False)
    contents, imports = convert_block(mod.body, scope)
    dct['contents'] = contents
    text = TEMPLATES['module'] % dct
    print text
    return text, imports

def convert_block(nodes, scope):
    text = ''
    imports = []
    for child in nodes:
        js, imp = convert_node(child, scope)
        imports += imp
        text += js
        #print js
    text = text.strip()
    text = '\n'.join('    '+line for line in text.split('\n'))
    return text, imports

def convert_node(node, scope):
    try:
        return globals()['_'+node.__class__.__name__.lower()](node, scope)
    except:
        print vars(node)
        raise

def _expr(node, scope):
    v = node.value
    js, imp = convert_node(v, scope)
    return js+';', imp
'''
    if isinstance(v, ast.Str):
        js, imp = _str(v, scope)
        js += ';'
        return js, imp
    else:
        raise PJsException, 'failed to convert %s' % v
'''

def _str(node, scope):
    return multiline(node.s), []

def _import(node, scope):
    print vars(node)
    tpl = '%s = __builtins__.__import__(%s, __globals__.__name__, __globals__.__file__);\n'
    text = ''
    imports = []
    for name in node.names:
        asname = name.name
        if name.asname:asname = name.asname
        asname, imp = do_left(ast.Name(asname, {}), scope)
        text += tpl % (asname, name.name)
        imports.append(name.name)
    return text, imports

def _print(node, scope):
    if node.dest:
        raise PJsException('print>> is not yet supported')
    values = []
    imports = []
    for child in node.values:
        js, imp = convert_node(child, scope)
        values.append(js)
        imports += imp
    text = '__builtins__.print(%s, %s);\n' % (', '.join(values), node.nl)
    return text, imports

def do_left(node, scope):
    if not isinstance(node, (ast.Name, ast.Attribute)):
        raise PJsException("unsupported left %s" % node)
    if scope[0] is scope[1]:
        if isinstance(node, ast.Name):
            return '__globals__.%s' % node.id, []
        js, imp = convert_node(node, scope)
        return '__globals__.%s' % js, imp
    elif isinstance(node, ast.Name):
        if scope[2]:
            return '__locals__.%s' % node.id, []
        if node.id not in scope[1]:
            scope[1].append(node.id)
            return 'var %s' % node.id, []
        else:
            return node.id, []
    elif isinstance(node, ast.Tuple):
        raise PJsException("tuple left assignments not yet supported")
    else:
        return convert_node(node, scope)

def _name(node, scope):
    return resolve(node.id, scope), []

def resolve(name, scope):
    if name in scope[1]:
        if scope[2]:
            return '__locals__.%s' % name
        return name
    else:
        return '__globals__.%s' % name

def _assign(node, scope):
    print vars(node)
    rest = ''
    imports = []
    if len(node.targets) == 1:
        t = node.targets[0]
        left, imp = do_left(t, scope)
        imports += imp
    else:
        left = 'var __pjs_tmp'
        for i,n in enumerate(node.targets):
            js, imp = convert_node(n, scope)
            imports += imp
            rest += '%s = __pjs_tmp[%d];\n' % (js, i)

    js, imp = convert_node(node.value, scope)
    imports += imp
    line = '%s = %s\n' % (left, js)
    return line + rest, imports

def do_op(node):
    ops = {ast.Eq:'===', ast.Add:'+', ast.Sub:'-', ast.Mult:'*', ast.Div:'/'}
    op = None
    for t,j in ops.iteritems():
        if isinstance(node, t):
            op = j
    if op is None:
        raise PJsException("Operator type %s not yet supported" % node)
    return op

def _binop(node, scope):
    print vars(node)
    op = do_op(node.op)
    imports = []
    ljs, imp = convert_node(node.left, scope)
    imports += imp
    rjs, imp = convert_node(node.right, scope)
    imports += imp
    return "%s %s %s" % (ljs, op, rjs), imports

def _num(node, scope):
    return str(node.n), []

def _attribute(node, scope):
    js, imp = convert_node(node.value, scope)
    return "%s.%s" % (js, node.attr), imp

def _functiondef(node, scope):
    dct = {}
    dct['left'], imports = do_left(ast.Name(node.name, []), scope)
    dct['name'] = node.name
    args = list(n.id for n in node.args.args)
    defaults = []
    for d,k in zip(reversed(node.args.defaults), reversed(args)):
        js, imp = convert_node(d, scope)
        imports += imp
        defaults.append("'%s': %s" % (k, js))
    dct['defaults'] = "{" + ','.join(defaults) + '}'
    if node.args.kwarg:
        special = dct['defaults'] + ', ' + str(bool(node.args.vararg)).lower() + ', true, '
    elif node.args.vararg:
        special = dct['defaults'] + ', true, '
    elif defaults:
        special = dct['defaults'] + ', '
    else:
        special = ''
    dct['special'] = special
    if node.args.vararg:
        args.append(node.args.vararg)
    if node.args.kwarg:
        args.append(node.args.kwarg)
    dct['args'] = ', '.join(args)

    if node.decorator_list:
        raise PJsException("decorators not implemented yet. they will be though")

    scope = scope[0], args[:], False
    dct['contents'], imp = convert_block(node.body, scope)
    imports += imp
    text = TEMPLATES['function'] % dct
    print text
    return text, imports

def _return(node, scope):
    js, imp = convert_node(node.value, scope)
    return 'return %s' % js, imp

def _classdef(node, scope):
    imports = []
    dct = {}
    dct['left'], imports = do_left(ast.Name(node.name, {}), scope)
    dct['name'] = node.name;
    dct['bases'] = ', '.join(resolve(name.id, scope) for name in node.bases)

    if len(node.decorator_list):
        raise PJsException('sorry, decorators not yet supported')

    scope = scope[0], [], True

    dct['contents'], imp = convert_block(node.body, scope)
    imports += imp

    text = TEMPLATES['class'] % dct
    print text
    return text, imports

def _if(node, scope):
    dct = {}
    dct['test'], imports = convert_node(node.test, scope)
    dct['contents'], imp = convert_block(node.body, scope)
    imports += imp
    if node.orelse:
        print node.orelse
        js, imp = convert_node(node.orelse[0], scope)
        dct['more'] = ' else ' + js
        imports += imp
    else:
        dct['more'] = ''
    text = TEMPLATES['if'] % dct
    print text
    return text, imports

def _compare(node, scope):
    text, imports = convert_node(node.left, scope)
    for cp, sub in zip(node.ops, node.comparators):
        js, imp = convert_node(sub, scope)
        imports += imp
        text += ' %s %s' % (do_op(cp), js)
    return text, imports

def _call(node, scope):
    print vars(node)
    print node

def do_compile(filename):
    print convert_modules(filename)


# vim: et sw=4 sts=4
