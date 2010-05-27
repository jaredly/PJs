#!/usr/bin/env python

import ast

JS_PREFIX = '_'

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
    var __%(lnum)s = {};
%(contents)s
    return __%(lnum)s;
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
if ($b.bool(%(test)s) === true) {
%(contents)s
}%(more)s
''',
}

import sys

pjs_modules = ['sys', 'os.path', '__builtin__']

all_imports = []
to_import = []

def convert_modules(filename, options):
    '''
    a function to convert python to javascript. uses python's ``ast`` module.
    returns (imports, js)

    - imports is a list of modules to be imported
    - js is text of the converted javascript code
    '''
    modules = {}
    filename = os.path.abspath(filename)
    while len(all_imports):
        all_imports.pop()
    while len(to_import):
        to_import.pop()
    all_imports.append(filename)
    while len(all_imports):
        fname = all_imports.pop()
        if fname in modules:
            continue
        text = open(fname).read()
        tree = ast.parse(text, fname)
        modules[fname] = convert_module(tree, fname)
        while len(to_import):
            name = to_import.pop()
            if name in pjs_modules:
                continue
            try:
                all_imports.append(find_import(name, fname))
            except PJsException:
                if not options.ignore_import_errors:
                    raise

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
    dct = {'scope':'_', 'filename':os.path.abspath(filename)}
    dct['doc'] = multiline(ast.get_docstring(mod))

    _globs = ['__name__','__doc__','__file__']
    # scope = (_globs, _globs, False, 0, [])
    scope = {
        'globals':[],
        'locals':[],
        'exp globals':[],
        'parent locals':(),
        'exp locals':False,
        'num iters':0,
        'in atomic':0,
    }
    scope['globals'] = scope['locals'] = _globs
    ## globals, locals, explicitlocal, numiters, explicitglobals
    contents = convert_block(mod.body, scope)
    dct['contents'] = contents
    text = TEMPLATES['module'] % dct
    return text

def convert_block(nodes, scope):
    text = ''
    for child in nodes:
        text += convert_node(child, scope)
    text = text.strip()
    text = '\n'.join('    '+line for line in text.split('\n'))
    return text

def convert_node(node, scope):
    ntype = node.__class__.__name__.lower()
    if '_' + ntype in globals():
        return globals()['_' + ntype](node, scope)
    else:
        print node
        if hasattr(node, '__dict__'):
            print node.__dict__
        raise PJsException('Node type %s hasn\'t been implemented yet' % node)

# Add, Sub, Mult, 

# alias only in import

# and, or

def _boolop(node, scope):
    bools = {
        ast.And:'&&',
        ast.Or:'||'
    }
    op = bools[node.op.__class__]
    ljs = convert_node(node.values[0], scope)
    rjs = convert_node(node.values[1], scope)
    return '$b.bool(%s) %s $b.bool(%s)' % (ljs, op, rjs)

#arugments -- in funcdef

def _assert(node, scope):
    js = convert_node(node.test, scope)
    if node.msg:
        msg = convert_node(node.msg, scope)
    else:
        msg = "'%s'" % js.encode('string_escape')
    text = '$b.assert(%s, %s);\n' % (js, msg)
    return text

def deepleft(node, at, scope, name='__pjs_tmp'):
    if isinstance(node, ast.Tuple):
        text = ''
        for i,n in enumerate(node.elts):
            text += deepleft(n, at + [i], scope, name)
        return text
    else:
        right = name + ''.join('.__getitem__(%d)' % n for n in at)
        js = do_left(node, scope)
        return '%s = %s;\n' % (js, right)

def _assign(node, scope):
    rest = ''
    target = node.targets[0]
    if isinstance(target, ast.Tuple):
        left = 'var __pjs_tmp'
        rest = deepleft(target, [], scope)
    else:
        left = do_left(target, scope)
    for targ in node.targets[1:]:
        var = left
        if var.startswith('var '):
            var = var[len('var '):]
        if isinstance(targ, ast.Tuple):
            rest += deepleft(targ, [], scope, var)
        else:
            mr = do_left(targ, scope)
            rest += mr + ' = ' + var + ';\n'
    js = convert_node(node.value, scope)
    line = '%s = %s;\n' % (left, js)
    return line + rest

def _attribute(node, scope):
    if node.attr in reserved_words:
        raise PJsException("Sorry, '%s' is a reserved word in javascript." % node.attr)
    js = convert_node(node.value, scope)
    if js == 'js':
        return 'js.%s' % (resolve(node.attr, scope))
    return "%s.%s" % (js, node.attr)

def _augassign(node, scope):
    tpl = '%s = $b.%s(%s, %s);\n'
    op = node.op.__class__.__name__.lower()
    ljs = convert_node(node.target, scope)
    rjs = convert_node(node.value, scope)
    js = do_left(node.target, scope)
    return tpl % (js, op, ljs, rjs)

def _augload(node, scope):
    raise Exception('i don\'t know what "AugLoad" is. if you see this, please email jared@jaredforsyth.com w/ code...')

def _augstore(node, scope):
    raise Exception('i don\'t know what "AugStore" is. if you see this, please email jared@jaredforsyth.com w/ code...')

def _binop(node, scope):
    tpl = '$b.%s(%s, %s)'
    op = node.op.__class__.__name__.lower()
    ljs = convert_node(node.left, scope)
    rjs = convert_node(node.right, scope)
    return tpl % (op, ljs, rjs)

#TODO: break
def _break(node, scope):
    return 'break;\n'
    
def _call(node, scope):
    left = convert_node(node.func, scope)
    raw_js = left.startswith('js.') or left.startswith('window.')

    if left == 'js':
        left = '$b.js'

    if not scope['in atomic']:
        scope = scope.copy()
        scope['in atomic'] = True
        if left.startswith('js.'):
            left = left[3:]

    if left == 'new':
        if node.starargs or node.kwargs or node.keywords or len(node.args) != 1:
            raise PJsException('the "new" function is reserved, and takes one argument')
        return 'new ' + convert_node(node.args[0], scope)

    dct = {}

    if node.starargs or node.kwargs or node.keywords:
        if raw_js:
            raise PJsException('cannot use *args, **kwds, or a=b in javascript functions')
        ## use .args()
        if node.args:
            args = []
            for n in node.args:
                js = convert_node(n, scope)
                args.append(js)
            dct['args'] = '$b.tuple([%s])' % ', '.join(args)
            if node.starargs:
                js = convert_node(node.starargs, scope)
                dct['args'] += '.__add__(%s)' % js
        elif node.starargs:
            js = convert_node(node.starargs, scope)
            dct['args'] = js
        else:
            dct['args'] = '$b.tuple([])'
        if node.keywords:
            kargs = []
            for kw in node.keywords:
                js = convert_node(kw.value, scope)
                kargs.append("'%s': %s" % (kw.arg, js))
            dct['kargs'] = '{%s}' % ', '.join(kargs)
            if node.kwargs:
                ## duplicates get overridden by kwargs
                js = convert_node(node.kwargs, scope)
                dct['kargs'] += '.extend(%s)' % js
        elif node.kwargs:
            js = convert_node(node.kwargs, scope)
            dct['kargs'] = js
        else:
            dct['kargs'] = '{}'
        dct['right'] = '.args(%s, %s)' % (dct['args'], dct['kargs'])
    else:
        args = []
        for n in node.args:
            ## TODO: check for literals
            js = convert_node(n, scope)
            if raw_js:
                ## in a javascript call
                js = '$b.js(%s)' % js
            args.append(js)
        dct['right'] = '(%s)' % ', '.join(args)
    text = left + dct['right']
    return text

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

def _classdef(node, scope):
    imports = []
    dct = {}
    dct['left'] = do_left(ast.Name(node.name, {}), scope)
    dct['name'] = node.name;
    dct['rname'] = resolve(node.name, scope);
    dct['bases'] = ', '.join(resolve(name.id, scope) for name in node.bases)

    dct['dec_front'] = ''
    dct['dec_back'] = ''
    for dec in node.decorator_list:
        js = convert_node(dec, scope)
        dct['dec_front'] += js+'('
        dct['dec_back'] += ')'

    scope = new_scope(scope)
    scope['exp locals'] = True

    dct['contents'] = convert_block(node.body, scope)
    dct['lnum'] = len(scope['parent locals'])

    text = TEMPLATES['class'] % dct
    return text

def _compare(node, scope):
    ops = {ast.Gt:'>',ast.GtE:'>=',ast.Lt:'<',ast.LtE:'<=',ast.Eq:'==',ast.NotEq:'!=', ast.IsNot:'!==', ast.Is:'==='}
    js = convert_node(node.left, scope)
    items = [js]
    for op, val in zip(node.ops, node.comparators):
        items.append("'%s'" % ops[op.__class__])
        js = convert_node(val, scope)
        items.append(js)
    return '$b.do_ops(%s)' % (', '.join(items))

# TODO: comprehension

def _continue(node, scope):
    return 'continue;\n'

def _delete(node, scope):
    t = []
    for tag in node.targets:
        js = convert_node(tag, scope)
        t.append('delete %s' % js)
    return '\n'.join(t)+'\n'

def _dict(node, scope):
    elts = []
    for k,v in zip(node.keys, node.values):
        js = convert_node(k, scope)
        j2 = convert_node(v, scope)
        elts.append('[%s, %s]' % (js, j2))
    text = '$b.dict([%s])' % ', '.join(elts)
    return text

#TODO: ellipsis

#TODO: exec...or not. I don't think I'll implement exec

def _expr(node, scope):
    js = convert_node(node.value, scope)
    return js+';\n'

# TODO: extslice, floordiv (its a binop, no?)

def _functiondef(node, scope):
    dct = {}
    dct['left'] = do_left(ast.Name(node.name, []), scope)
    dct['name'] = node.name
    try:
        dct['rname'] = resolve(node.name, scope);
    except PJsNameError, e:
        print scope
        raise PJsException('UndefinedNameError: %s on line %d' % (e, node.lineno))
    args = list(n.id for n in node.args.args)
    defaults = []
    for d,k in zip(reversed(node.args.defaults), reversed(args)):
        js = convert_node(d, scope)
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
        js = convert_node(dec, scope)
        dct['dec_front'] += js+'('
        dct['dec_back'] += ')'

    scope = new_scope(scope)
    scope['exp locals'] = False

    for n in args:
        scope['locals'].append(n)
    dct['contents'] = convert_block(node.body, scope)
    text = TEMPLATES['function'] % dct
    return text

#TODO: genexp, global

def _global(node, scope):
    js = '// switching to global scope: %s\n' % ', '.join(node.names)
    for name in node.names:
        scope['exp globals'].append(name)
    return js

def _if(node, scope):
    dct = {}
    dct['test'] = convert_node(node.test, scope)
    dct['contents'] = convert_block(node.body, scope)
    if node.orelse:
        if len(node.orelse) == 1:
            js = convert_node(node.orelse[0], scope)
            dct['more'] = ' else ' + js
        else:
            js = convert_block(node.orelse, scope)
            dct['more'] = ' else {\n%s\n}' % js
    else:
        dct['more'] = ''
    text = TEMPLATES['if'] % dct
    return text

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
    if node.module == '__future__':
        return ''
    template = 'var __pjs_tmp_module = $b.__import__("%s", _.__name__, _.__file__);\n' % node.module
    prefix = local_prefix(scope)
    for alias in node.names:
        if alias.name == '*':
            template += all_import % (prefix, prefix)
            break
        asname = alias.asname or alias.name
        template += '%s%s = __pjs_tmp_module.%s;\n' % (prefix, asname, alias.name)
    to_import.append(node.module)
    return template

def _import(node, scope):
    tpl = '%s = $b.__import__("%s", _.__name__, _.__file__);\n'
    text = ''
    for name in node.names:
        asname = name.name
        if name.asname:asname = name.asname
        asname = do_left(ast.Name(asname, {}), scope)
        text += tpl % (asname, name.name)
        to_import.append(name.name)
    return text

#TODO: lambda?

def _list(node, scope):
    elts = []
    for sub in node.elts:
        js = convert_node(sub, scope)
        elts.append(js)
    text = '$b.list([%s])' % ', '.join(elts)
    return text

#TODO: listcomp

def _name(node, scope):
    try:
        return resolve(node.id, scope)
    except PJsNameError, e:
        print scope
        raise PJsException('UndefinedNameError: %s on line %d' % (e, node.lineno))

import os
localfile = lambda x:os.path.join(os.path.dirname(__file__), x)
reserved_words = open(localfile('js_reserved.txt')).read().split()

def resolve(name, scope):
    if name == 'window':
        return name
    elif name == 'js':
        return name
    elif name in ('float', 'int'):
        name = '_' + name
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
    elif name not in scope['globals'] and name in __builtins__:
        return '$b.%s' % name
    else:
        ## for all we know, it's not defined....
        if scope['locals'] is scope['globals']:
            return '$b.assertdefined(_.%s, "%s")' % (name, name)
        elif scope['exp locals']:
            return '$b.assertdefined(__%d.%s, "%s")' % (len(scope['parent locals']), name, name)
        else:
            return '$b.assertdefined(%s, "%s")' % (name, name)

def _num(node, scope):
    if type(node.n) == float:
        return '$b._float(%f)' % node.n
    return str(node.n)

def _pass(node, scope):
    return ''

def _print(node, scope):
    if node.dest:
        raise PJsException('print>> is not yet supported')
    values = []
    for child in node.values:
        js = convert_node(child, scope)
        values.append(js)
    text = '$b.print(%s);//, %s\n' % (', '.join(values), str(node.nl).lower())
    return text 

def _raise(node, scope):
    js = convert_node(node.type, scope)
    if node.inst is None:
        return '$b.raise(%s);\n' % js
    inner = convert_node(node.inst, scope)
    return '$b.raise(%s(%s));\n' % (js, inner)

def _return(node, scope):
    if node.value is None:
        return 'return;\n'
    js = convert_node(node.value, scope)
    return 'return %s;\n' % js

def _subscript(node, scope):
    left = convert_node(node.value, scope)
    raw_js = left.startswith('js.') or left.startswith('window.')

    if not scope['in atomic']:
        scope = scope.copy()
        scope['in atomic'] = True
        if left.startswith('js.'):
            left = left[3:]

    if isinstance(node.slice, ast.Slice) and node.slice.step is None:
        if raw_js:
            if node.slice.lower:
                lower = convert_node(node.slice.lower, scope)
            else:
                lower = 0
            if node.slice.upper is None:
                return '%s.slice(%s)' % (left, lower)
            else:
                upper = convert_node(node.slice.upper, scope)
                return '%s.slice(%s, %s)' % (left, lower, upper)
        
        if node.slice.upper is not None:
            upper = convert_node(node.slice.upper, scope)
            if node.slice.lower:
                lower = convert_node(node.slice.lower, scope)
            else:
                lower = 0
            return '%s.__getslice__(%s, %s)' % (left, lower, upper)
    idex = convert_node(node.slice, scope)

    if raw_js:
        if isinstance(node.slice, ast.Slice):
            raise PJsException('no steps in javascript slices')
        ## in javascript line
        # TODO check idex for literal
        return '%s[$b.js(%s)]' % (left, idex)

    return '%s.__getitem__(%s)' % (left, idex)

def _index(node, scope):
    return convert_node(node.value, scope)

def _slice(node, scope):
    if node.lower:
        lower = convert_node(node.lower, scope)
    else:
        lower = 'null'
    if node.upper:
        upper = convert_node(node.upper, scope)
    else:
        upper = 'null'
    if node.step:
        step = convert_node(node.step, scope)
    else:
        step = '1'
    return '$b.slice(%s, %s, %s)' % (lower, upper, step)

def _str(node, scope):
    return '$b.str(%s)' % multiline(node.s)

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
    body = convert_block(node.body, scope)
    subs = []
    for handler in node.handlers:
        eb = ''
        if handler.name is not None:
            name = do_left(handler.name, scope)
            eb = '    %s = __pjs_err;\n    ' % name
        eb_ = convert_block(handler.body, scope)
        eb += eb_

        if handler.type is not None:
            t = convert_node(handler.type, scope)
            top = 'if (__pjs_err.__class__ && $b.isinstance(__pjs_err, %s)) ' % t
        else:
            top = ''

        subs.append(single % (top, eb))
    text = template % (body, ' else '.join(subs))
    return text

#TODO: tryfinally

def _tuple(node, scope):
    elts = []
    imports = []
    for sub in node.elts:
        js = convert_node(sub, scope)
        elts.append(js)
    text = '$b.tuple([%s])' % ', '.join(elts)
    return text

#unaryop

def _unaryop(node, scope):
    js = convert_node(node.operand, scope)
    jss = {ast.Not:'!$b.bool(%s)',
           ast.UAdd:'+%s',
           ast.USub:'-%s'}
    return jss[node.op.__class__] % js

def _while(node, scope):
    if node.orelse:
        raise PJsException('while...else not implemented')
    tpl = '''\
while ($b.bool(%s) === true) {
%s
}
'''
    test = convert_node(node.test, scope)
    body = convert_block(node.body, scope)
    return tpl % (test, body)

def _for(node, scope):
    tpl = '''\
var __pjs_iter%d = $b.foriter(%s);
while (__pjs_iter%d.trynext()) {
    %s
%s
}
'''
    ible = convert_node(node.iter, scope)
    inum = scope['num iters']
    # need to fix for tuples...
    if isinstance(node.target, ast.Name):
        targ = do_left(node.target, scope)
        assign = '%s = __pjs_iter%d.value;\n' % (targ, inum)
    else:
        assign = deepleft(node.target, [], scope, '__pjs_iter%d.value' % inum).replace('\n', '\n    ')

    scope = scope.copy()
    scope['num iters'] += 1
    body = convert_block(node.body, scope)
    return tpl % (inum, ible, inum, assign, body)

#WONTFIX: with

#TODO: Yield

def _yield(node, scope):
    raise PJsException('Sorry, PJs doesn\'t work with generators, and probably won\'t for the forseeable future...generators are hard.')

def local_prefix(scope):
    if scope['globals'] is scope['locals']:
        return '_.'
    if scope['exp locals']:
        return '__%d.' % len(scope['parent locals'])
    return ''

def do_left(node, scope):
    if not isinstance(node, (ast.Name, ast.Attribute)):
        raise PJsException("unsupported left %s" % node)
    if isinstance(node, ast.Name) and node.id in scope['exp globals']:
        return '_.%s' % node.id
    if scope['globals'] is scope['locals']:
        if isinstance(node, ast.Name):
            if node.id not in scope['globals']:
                scope['globals'].append(node.id)
            return '_.%s' % node.id
        js = convert_node(node, scope)
        return '_.%s' % js
    elif isinstance(node, ast.Name):
        if scope['exp locals']:
            if node.id not in scope['locals']:
                scope['locals'].append(node.id)
            return '__%d.%s' % (len(scope['parent locals']), node.id)
        if node.id not in scope['locals']:
            scope['locals'].append(node.id)
            return 'var %s' % node.id
        else:
            return node.id
    elif isinstance(node, ast.Tuple):
        raise PJsException("tuple left assignments not yet supported")
    else:
        return convert_node(node, scope)

html_out = '''\
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
    <!-- File generated by PJs http://jaredforsyth.com/projects/pjs -->
    <head>
        <title>Auto PJs output for %(file)s</title>
        <script src="%(lib)s"></script>
    </head>
    <body>
        <script>
%(text)s
__builtins__.run_main('%(file)s');
        </script>

    </body>
</html>'''

js_out = '''\
/*** File generated by PJs http://jaredforsyth.com/projects/pjs ***/

// from source file %(file)s

%(text)s
__builtins__.run_main('%(file)s');
'''

rhino_out = '''\
/*** File generated by PJs http://jaredforsyth.com/projects/pjs ***/

// from source file %(file)s

load("%(lib)s");
var console = {log:function(){print.apply(this, arguments);}};
%(text)s
__builtins__.__import__('sys').argv = __builtins__.list(arguments);
__builtins__.run_main('%(file)s');
'''

def do_compile(filename, fmt, options):
    modules = convert_modules(filename, options)
    text = '\n'.join(modules[filen] for filen in sorted(modules.keys()))
    lib = os.path.join(options.lib_dir, 'pjslib.js')
    data = {'file':os.path.abspath(filename), 'text':text, 'lib':lib}
    if options.rhino:
        template = rhino_out
    elif options.html:
        template = html_out
    else:
        template = js_out
    return template % data


# vim: et sw=4 sts=4
