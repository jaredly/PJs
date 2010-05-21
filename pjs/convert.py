#!/usr/bin/env python

import ast

class PJsException(Exception):pass
class PJsNameError(PJsException):pass

TEMPLATES = {
    'module':'''\
module('%(filename)s', function (%(scope)s) {
    %(scope)s.__doc__ = %(doc)s;
%(contents)s
});
''',
    'class':'''\
%(left)s = %(dec_front)sClass('%(name)s', [%(bases)s], (function(){
    var __ = {};
%(contents)s
    return __;
}()))%(dec_back)s;
%(rname)s.__module__ = _.__name__;
''',
    'function':'''\
%(left)s = %(dec_front)s$m(%(special)sfunction (%(args)s) {
%(contents)s
})%(dec_back)s;
%(rname)s.__module__ = _.__name__;
%(rname)s.__name__ = "%(name)s";
''',
    'if':'''\
if (%(test)s) {
%(contents)s
}%(more)s
''',
}

import sys

pjs_modules = ['sys', 'os.path', '__builtin__']

def convert_modules(filename):
    '''
    a function to cunvert python to javascript. uses python's ``ast`` module.
    returns (imports, js)

    - imports is a list of modules to be imported
    - js is text of the converted javascript code
    '''
    modules = {}
    filename = os.path.abspath(filename)
    toimport = [filename]
    while len(toimport):
        fname = toimport.pop()
        if fname in modules:
            continue
        text = open(fname).read()
        tree = ast.parse(text, fname)
        js, imports = convert_module(tree, fname)
        for imp in imports:
            if imp in pjs_modules:
                continue
            toimport.append(find_import(imp, fname))
        modules[fname] = js

    return modules

def find_import(iname, fname):
    base = os.path.dirname(fname)
    cd = os.getcwd()
    for dr in sys.path:
        if dr == cd:
            dr = base
        fn = os.path.join(base, dr)
        bad = False
        for part in iname.split('.')[:-1]:
            if not os.path.exists(os.path.join(fn, part, '__init__.py')):
                bad = True
                break
            fn = os.path.join(fn, part)
        if not bad:
            fn = os.path.join(fn, iname.split('.')[-1]+'.py')
            if os.path.exists(fn):
                return fn
    raise PJsException('module not found: %s' % iname)

def multiline(text):
    if text is None:
        return '""';
    lines = text.split('\n')
    return ''.join("'%s\\n' +\n" % line.encode('string_escape') for line\
            in lines[:-1]) + "'%s'" % lines[-1].encode('string_escape')

def convert_module(mod, filename):
    scope = '_'
    dct = {'scope':scope, 'filename':os.path.abspath(filename)}
    dct['doc'] = multiline(ast.get_docstring(mod))

    _globs = ['__name__','__doc__','__file__']
    scope = (_globs, _globs, False, 0, [])
    ## globals, locals, explicitlocal, numiters, explicitglobals
    contents, imports = convert_block(mod.body, scope)
    dct['contents'] = contents
    text = TEMPLATES['module'] % dct
    return text, imports

def convert_block(nodes, scope):
    text = ''
    imports = []
    for child in nodes:
        js, imp = convert_node(child, scope)
        imports += imp
        text += js
    text = text.strip()
    text = '\n'.join('    '+line for line in text.split('\n'))
    return text, imports

def convert_node(node, scope):
    try:
        return globals()['_'+node.__class__.__name__.lower()](node, scope)
    except KeyError, e:
        if not e.args[0].startswith('Node type'):
            if hasattr(node, '__dict__'):
                print vars(node)
            else:
                print node
            e.args = ('Node type %s hasn\'t been implemented yet' % node, )
        raise

# Add, Sub, Mult, 

# alias only in import

# and, or
def _boolop(node, scope):
    bools = {
        ast.And:'&&',
        ast.Or:'||'
    }
    op = bools[node.op.__class__]
    imports = []
    ljs, imp = convert_node(node.values[0], scope)
    imports += imp
    rjs, imp = convert_node(node.values[1], scope)
    imports += imp
    return '%s %s %s' % (ljs, op, rjs), imports

#arugments -- in funcdef

def _assert(node, scope):
    js, imports = convert_node(node.test, scope)
    if node.msg:
        msg, imp = convert_node(node.msg, scope)
        imports += imp
    else:
        msg = "'%s'" % js.encode('string_escape')
    text = '$b.assert(%s, %s);\n' % (js, msg)
    return text, imports

def deepleft(node, at, scope, name='__pjs_tmp'):
    if isinstance(node, ast.Tuple):
        text = ''
        for i,n in enumerate(node.elts):
            text += deepleft(n, at + [i], scope, name)
        return text
    else:
        right = name + ''.join('.__getitem__(%d)' % n for n in at)
        js, imp = do_left(node, scope)
        return '%s = %s;\n' % (js, right)

def _assign(node, scope):
    rest = ''
    imports = []
    target = node.targets[0]
    if isinstance(target, ast.Tuple):
        left = 'var __pjs_tmp'
        rest = deepleft(target, [], scope)
    else:
        left, imp = do_left(target, scope)
        imports += imp
    for targ in node.targets[1:]:
        var = left
        if var.startswith('var '):
            var = var[len('var '):]
        if isinstance(targ, ast.Tuple):
            rest += deepleft(targ, [], scope, var)
        else:
            mr, imp = do_left(targ, scope)
            rest += mr + ' = ' + var + ';\n'

    js, imp = convert_node(node.value, scope)
    imports += imp
    line = '%s = %s;\n' % (left, js)
    return line + rest, imports

def _attribute(node, scope):
    js, imp = convert_node(node.value, scope)
    if node.attr in reserved_words:
        raise PJsException("Sorry, '%s' is a reserved word in javascript." % node.attr)
    return "%s.%s" % (js, node.attr), imp

def _augassign(node, scope):

    tpl = '%s = $b.%s(%s, %s);\n'
    op = node.op.__class__.__name__.lower()
    imports = []
    ljs, imp = convert_node(node.target, scope)
    imports += imp
    rjs, imp = convert_node(node.value, scope)
    imports += imp

    js, imp = do_left(node.target, scope)
    return tpl % (js, op, ljs, rjs), imports

def _augload(node, scope):
    raise Exception('i don\'t know what "AugLoad" is. if you see this, please email jared@jaredforsyth.com w/ code...')

def _augstore(node, scope):
    raise Exception('i don\'t know what "AugStore" is. if you see this, please email jared@jaredforsyth.com w/ code...')

def _binop(node, scope):
    tpl = '$b.%s(%s, %s)'
    op = node.op.__class__.__name__.lower()
    imports = []
    ljs, imp = convert_node(node.left, scope)
    imports += imp
    rjs, imp = convert_node(node.right, scope)
    imports += imp
    return tpl % (op, ljs, rjs), imports

#TODO: break
def _break(node, scope):
    return 'break;\n', []
    
def _call(node, scope):
    imports = []
    dct = {}
    if node.starargs or node.kwargs or node.keywords:
        ## use .args()
        if node.args:
            args = []
            for n in node.args:
                js, imp = convert_node(n, scope)
                imports += imp
                args.append(js)
            dct['args'] = '$b.tuple([%s])' % ', '.join(args)
            if node.starargs:
                js, imp = convert_node(node.starargs, scope)
                imports += imp
                dct['args'] += '.__add__(%s)' % js
        elif node.starargs:
            js, imp = convert_node(node.starargs, scope)
            imports += imp
            dct['args'] = js
        else:
            dct['args'] = '$b.tuple([])'
        if node.keywords:
            kargs = []
            for kw in node.keywords:
                js, imp = convert_node(kw.value, scope)
                imports += imp
                kargs.append("'%s': %s" % (kw.arg, js))
            dct['kargs'] = '{%s}' % ', '.join(kargs)
            if node.kwargs:
                ## duplicates get overridden by kwargs
                js, imp = convert_node(node.kwargs, scope)
                imports += imp
                dct['kargs'] += '.extend(%s)' % js
        elif node.kwargs:
            js, imp = convert_node(node.kwargs, scope)
            imports += imp
            dct['kargs'] = js
        else:
            dct['kargs'] = '{}'
        dct['right'] = '.args(%s, %s)' % (dct['args'], dct['kargs'])
    else:
        args = []
        for n in node.args:
            js, imp = convert_node(n, scope)
            imports += imp
            args.append(js)
        dct['right'] = '(%s)' % ', '.join(args)
    dct['left'], imp = convert_node(node.func, scope)
    imports += imp
    text = dct['left'] + dct['right']
    return text, imports

def _classdef(node, scope):
    imports = []
    dct = {}
    dct['left'], imports = do_left(ast.Name(node.name, {}), scope)
    dct['name'] = node.name;
    dct['rname'] = resolve(node.name, scope);
    dct['bases'] = ', '.join(resolve(name.id, scope) for name in node.bases)

    dct['dec_front'] = ''
    dct['dec_back'] = ''
    for dec in node.decorator_list:
        js, imp = convert_node(dec, scope)
        imports += imp
        dct['dec_front'] += js+'('
        dct['dec_back'] += ')'

    scope = scope[0], [], True, 0, []

    dct['contents'], imp = convert_block(node.body, scope)
    imports += imp

    text = TEMPLATES['class'] % dct
    return text, imports

def _compare(node, scope):
    ops = {ast.Gt:'>',ast.GtE:'>=',ast.Lt:'<',ast.LtE:'<=',ast.Eq:'==',ast.NotEq:'!=', ast.IsNot:'!==', ast.Is:'==='}
    js, imports = convert_node(node.left, scope)
    items = [js]
    for op, val in zip(node.ops, node.comparators):
        items.append("'%s'" % ops[op.__class__])
        js, imp = convert_node(val, scope)
        items.append(js)
        imports += imp
    return '$b.do_ops(%s)' % (', '.join(items)), imports
    '''
    if len(node.ops) > 1:
        raise PJsException('sorry, multiple comparisons 1 > 2 > 3 is not supported.')
    tpl = '$b.%s(%s, %s)'
    op = node.ops[0].__class__.__name__.lower()
    ljs, imp = convert_node(node.left, scope)
    imports += imp
    rjs, imp = convert_node(node.comparators[0], scope)
    imports += imp
    return tpl % (op, ljs, rjs), imports
    '''

# TODO: comprehension

def _continue(node, scope):
    return 'continue;\n', []

def _delete(node, scope):
    t = []
    imports = []
    for tag in node.targets:
        js, imp = convert_node(tag, scope)
        t.append('delete %s' % js)
        imports += imp
    return '\n'.join(t)+'\n', imports

def _dict(node, scope):
    elts = []
    imports = []
    for k,v in zip(node.keys, node.values):
        js, imp = convert_node(k, scope)
        imports += imp
        j2, imp = convert_node(v, scope)
        imports += imp
        elts.append('[%s, %s]' % (js, j2))
    text = '$b.dict([%s])' % ', '.join(elts)
    return text, imports

#TODO: ellipsis

#TODO: exec...or not. I don't think I'll implement exec

def _expr(node, scope):
    js, imp = convert_node(node.value, scope)
    return js+';\n', imp

# TODO: extslice, floordiv (its a binop, no?)

def _functiondef(node, scope):
    dct = {}
    dct['left'], imports = do_left(ast.Name(node.name, []), scope)
    dct['name'] = node.name
    try:
        dct['rname'] = resolve(node.name, scope);
    except PJsNameError, e:
        print scope
        raise PJsException('UndefinedNameError: %s on line %d' % (e, node.lineno))
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

    dct['dec_front'] = ''
    dct['dec_back'] = ''
    for dec in node.decorator_list:
        js, imp = convert_node(dec, scope)
        imports += imp
        dct['dec_front'] += js+'('
        dct['dec_back'] += ')'

    # scope = scope[0], scope[1]+args[:], False
    scope = (scope[0], [], False, scope[3], [])
    for n in args:
        scope[1].append(n)
    dct['contents'], imp = convert_block(node.body, scope)
    imports += imp
    text = TEMPLATES['function'] % dct
    return text, imports

#TODO: genexp, global

def _global(node, scope):
    js = '// switching to global scope: %s\n' % ', '.join(node.names)
    for name in node.names:
        scope[4].append(name)
    return js, []

def _if(node, scope):
    dct = {}
    dct['test'], imports = convert_node(node.test, scope)
    dct['contents'], imp = convert_block(node.body, scope)
    imports += imp
    if node.orelse:
        if len(node.orelse) == 1:
            js, imp = convert_node(node.orelse[0], scope)
            dct['more'] = ' else ' + js
            imports += imp
        else:
            js, imp = convert_block(node.orelse, scope)
            imports += imp
            dct['more'] = ' else {\n%s\n}' % js
    else:
        dct['more'] = ''
    text = TEMPLATES['if'] % dct
    return text, imports

#TODO: ifexp

all_import = '''if (__pjs_tmp_module.__all__ === undefined) {
    for (var __pjs_k in __pjs_tmp_module) {
        if (__pjs_k.indexOf('__') !== 0)
            eval('%s'+__pjs_k+' = __pjs_tmp_module.'+__pjs_k+';');
    }
    delete __pjs_k;
} else {
    var __pjs_a = __pjs_tmp_module.__all__.as_js();
    for (var __pjs_i=0; __pjs_i<__pjs_a.length; __pjs_i++) {
        var __pjs_k = __pjs_a[__pjs_i];
        eval('%s'+__pjs_k+' = __pjs_tmp_module.'+__pjs_k+';');
    }
    delete __pjs_a;
    delete __pjs_i;
    delete __pjs_k;
}
'''

def _importfrom(node, scope):
    template = 'var __pjs_tmp_module = $b.__import__("%s", _.__name__, _.__file__);\n' % node.module
    prefix = local_prefix(scope)
    for alias in node.names:
        if alias.name == '*':
            template += all_import % (prefix, prefix)
            break
        asname = alias.asname or alias.name
        template += '%s%s = __pjs_tmp_module.%s;\n' % (prefix, asname, alias.name)
    return template, [node.module]

def _import(node, scope):
    tpl = '%s = $b.__import__("%s", _.__name__, _.__file__);\n'
    text = ''
    imports = []
    for name in node.names:
        asname = name.name
        if name.asname:asname = name.asname
        asname, imp = do_left(ast.Name(asname, {}), scope)
        text += tpl % (asname, name.name)
        imports.append(name.name)
    return text, imports

#TODO: lambda?

def _list(node, scope):
    elts = []
    imports = []
    for sub in node.elts:
        js, imp = convert_node(sub, scope)
        elts.append(js)
        imports+=imp
    text = '$b.list([%s])' % ', '.join(elts)
    return text, imports

#TODO: listcomp

def _name(node, scope):
    try:
        return resolve(node.id, scope), []
    except PJsNameError, e:
        print scope
        raise PJsException('UndefinedNameError: %s on line %d' % (e, node.lineno))

import os
localfile = lambda x:os.path.join(os.path.dirname(__file__), x)
reserved_words = open(localfile('js_reserved.txt')).read().split()

def resolve(name, scope):
    if name in reserved_words:
        raise PJsException("Sorry, '%s' is a reserved word in javascript." % name)
    if name in scope[4]:
        return '_.%s' % name
    elif scope[0] is scope[1] and name in scope[0]:
        return '_.%s' % name
    elif name in scope[1]:
        if scope[2]:
            return '__.%s' % name
        return name
    elif name in scope[0]:
        return '_.%s' % name
    elif name not in scope[0] and name in __builtins__:
        return '$b.%s' % name
    else:
        ## for all we know, it's not defined....
        if scope[0] is scope[1]:
            return '$b.assertdefined(_.%s)' % name
        elif scope[2]:
            return '$b.assertdefined(__.%s)' % name
        else:
            return '$b.assertdefined(%s)' % name

def _num(node, scope):
    return str(node.n), []

def _pass(node, scope):
    return '', []

def _print(node, scope):
    if node.dest:
        raise PJsException('print>> is not yet supported')
    values = []
    imports = []
    for child in node.values:
        js, imp = convert_node(child, scope)
        values.append(js)
        imports += imp
    text = '$b.print(%s);//, %s\n' % (', '.join(values), str(node.nl).lower())
    return text, imports

def _raise(node, scope):
    js, imports = convert_node(node.type, scope)
    if node.inst is None:
        return '$b.raise(%s);\n' % js, imports
    inner, imp = convert_node(node.inst, scope)
    imports += imp
    return '$b.raise(%s(%s));\n' % (js, inner), imports

def _return(node, scope):
    if node.value is None:
        return 'return;\n', []
    js, imp = convert_node(node.value, scope)
    return 'return %s;\n' % js, imp

def _subscript(node, scope):
    js, imports = convert_node(node.value, scope)
    if isinstance(node.slice, ast.Slice) and node.slice.step is None:
        upper = convert_node(node.slice.upper, scope)[0]
        if node.slice.lower:
            lower = convert_node(node.slice.lower, scope)[0]
        else:
            lower = 0
        return '%s.__getslice__(%s, %s)' % (js, lower, upper), imports
    idex, imp = convert_node(node.slice, scope)
    return '%s.__getitem__(%s)' % (js, idex), imports+imp

def _index(node, scope):
    return convert_node(node.value, scope)

def _slice(node, scope):
    if node.lower:
        lower = convert_node(node.lower, scope)[0]
    else:
        lower = 'null'
    if node.upper:
        upper = convert_node(node.upper, scope)[0]
    else:
        upper = 'null'
    if node.step:
        step = convert_node(node.step, scope)[0]
    else:
        step = '1'
    return '$b.slice(%s, %s, %s)' % (lower, upper, step), []

def _str(node, scope):
    return '$b.str(%s)' % multiline(node.s), []

def _tryexcept(node, scope):
    imports = []
    template = '''try {
%s
} catch (__pjs_err) {
    %s
}
'''
    single = '''%s{
    %s
    }'''
    body, imports = convert_block(node.body, scope)
    subs = []
    for handler in node.handlers:
        eb = ''
        if handler.name is not None:
            name, imp = do_left(handler.name, scope)
            eb = '    %s = __pjs_err;\n    ' % name
        eb_, imp = convert_block(handler.body, scope)
        eb += eb_
        imports += imp

        if handler.type is not None:
            t, imp = convert_node(handler.type, scope)
            imports += imp
            top = 'if (__pjs_err.__class__ && $b.isinstance(__pjs_err, %s)) ' % t
        else:
            top = ''

        subs.append(single % (top, eb))
    text = template % (body, ' else '.join(subs))
    return text, imports

#TODO: tryfinally

def _tuple(node, scope):
    elts = []
    imports = []
    for sub in node.elts:
        js, imp = convert_node(sub, scope)
        elts.append(js)
        imports+=imp
    text = '$b.tuple([%s])' % ', '.join(elts)
    return text, imports

#unaryop

def _unaryop(node, scope):
    js, imp = convert_node(node.operand, scope)
    jss = {ast.Not:'!$b.bool(%s)',
           ast.UAdd:'+%s',
           ast.USub:'-%s'}
    return jss[node.op.__class__] % js, imp

def _while(node, scope):
    if node.orelse:
        raise PJsException('while...else not implemented')
    tpl = '''\
while (%s) {
%s
}
'''
    test, imports = convert_node(node.test, scope)
    body, imp = convert_block(node.body, scope)
    return tpl % (test, body), imports + imp

def _for(node, scope):
    tpl = '''\
var __pjs_iter%d = $b.foriter(%s);
while (__pjs_iter%d.trynext()) {
    %s
%s
}
'''
    ible, imports = convert_node(node.iter, scope)
    inum = scope[3]
    # need to fix for tuples...
    if isinstance(node.target, ast.Name):
        targ, imp = do_left(node.target, scope)
        assign = '%s = __pjs_iter%d.value;\n' % (targ, inum)
        imports += imp
    else:
        assign = deepleft(node.target, [], scope, '__pjs_iter%d.value' % inum).replace('\n', '\n    ')

    body, imp = convert_block(node.body, scope[:3] + (scope[3]+1,) + ([],))
    imports += imp
    return tpl % (inum, ible, inum, assign, body), imports

#WONTFIX: with

#TODO: Yield

def _yield(node, scope):
    raise PJsException('Sorry, PJs doesn\'t work with generators, and probably won\'t for the forseeable future...generators are hard.')

def local_prefix(scope):
    if scope[0] is scope[1]:
        return '_.'
    elif isinstance(node, ast.Name):
        if scope[2]:
            return '__.'
        return 'var '
    return ''

def do_left(node, scope):
    if not isinstance(node, (ast.Name, ast.Attribute)):
        raise PJsException("unsupported left %s" % node)
    if isinstance(node, ast.Name) and node.id in scope[4]:
        return '_.%s' % node.id, []
    if scope[0] is scope[1]:
        if isinstance(node, ast.Name):
            if node.id not in scope[0]:
                scope[0].append(node.id)
            return '_.%s' % node.id, []
        js, imp = convert_node(node, scope)
        return '_.%s' % js, imp
    elif isinstance(node, ast.Name):
        if scope[2]:
            if node.id not in scope[1]:
                scope[1].append(node.id)
            return '__.%s' % node.id, []
        if node.id not in scope[1]:
            scope[1].append(node.id)
            return 'var %s' % node.id, []
        else:
            return node.id, []
    elif isinstance(node, ast.Tuple):
        raise PJsException("tuple left assignments not yet supported")
    else:
        return convert_node(node, scope)




for_rhino = '''
load("%(dir)s/build/pjslib.js");
'''

do_run = '''
$b.run_main('%s');
'''

def do_compile(filename):
    mods = convert_modules(filename)
    text = for_rhino % {'dir':'.'}
    for fn in sorted(mods.keys()):
        text += mods[fn]+'\n\n'
    text += do_run % os.path.abspath(filename)
    return text


# vim: et sw=4 sts=4
