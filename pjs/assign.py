import ast
from converter import register as converts, PJsNotImplemented
import utils

def deepleft(conv, node, at, scope, name='__pjs_tmp'):
    if isinstance(node, ast.Tuple):
        text = ''
        for i,n in enumerate(node.elts):
            text += deepleft(conv, n, at + [i], scope, name)
        return text
    else:
        right = name + ''.join('.__getitem__(%d)' % n for n in at)
        if isinstance(node, ast.Subscript):
            left = conv.get_converter(node)(node, scope, True)
            if left.endswith(' '):
                return left + right + ');\n'
        else:
            left = utils.lhand_assign(node.id, scope)
        return '%s = %s;\n' % (left, right)

@converts(ast.Assign)
def assign(conv, node, scope):
    rest = ''
    target = node.targets[0]
    if isinstance(target, ast.Tuple):
        left = 'var __pjs_tmp'
        rest = deepleft(conv, target, [], scope)
    elif isinstance(target, ast.Subscript):
        left = conv.get_converter(target)(target, scope, True)
        if left.endswith(' '):
            return left + conv.convert_node(node.value, scope) + ');\n'
    else:
        left = utils.lhand_assign(target.id, scope)

    for targ in node.targets[1:]:
        var = left
        if var.startswith('var '):
            var = var[len('var '):]
        if isinstance(targ, ast.Tuple):
            rest += deepleft(conv, targ, [], scope, var)
        else:
            mr = utils.lhand_assign(targ.id, scope)
            rest += mr + ' = ' + var + ';\n'
    js = conv.convert_node(node.value, scope)
    line = '%s = %s;\n' % (left, js)
    return line + rest

@converts(ast.AugAssign)
def _augassign(conv, node, scope):
    tpl = '%s = $b.%s(%s, %s);\n'
    op = node.op.__class__.__name__.lower()
    ljs = conv.convert_node(node.target, scope)
    rjs = conv.convert_node(node.value, scope)
    if isinstance(node.target, ast.Subscript):
        left = conv.get_converter(node.target)(node.target, scope, True)
        if left.endswith(' '):
            return left + conv.convert_node(node.value, scope) + ');\n'
    else:
        left = utils.lhand_assign(node.target.id, scope)
    return tpl % (left, op, ljs, rjs)

@converts(ast.AugLoad)
def _augload(node, scope):
    raise PJsNotImplemented('i don\'t know what "AugLoad" is. if you see this, please email jared@jaredforsyth.com w/ code...')

@converts(ast.AugStore)
def _augstore(node, scope):
    raise PJsNotImplemented('i don\'t know what "AugStore" is. if you see this, please email jared@jaredforsyth.com w/ code...')

# vim: et sw=4 sts=4
