import ast
from converter import register as converts, PJsNotImplemented

WHILE_TPL = '''\
while ($b.bool(%s) === true) {
%s
}
'''

@converts(ast.While)
def _while(conv, node, scope):
    if node.orelse:
        raise PJsNotImplemented('while...else not implemented')
    test = conv.convert_node(node.test, scope)
    body = conv.convert_block(node.body, scope)
    return WHILE_TPL % (test, body)

FOR_TPL = '''\
var %s = $b.foriter(%s);
while (%s.trynext()) {
    %s
%s
}
'''

@converts(ast.For)
def _for(conv, node, scope):
    ible = conv.convert_node(node.iter, scope)
    temp_iter = conv.get_temp('iter')
    if isinstance(node.target, ast.Name):
        targ = utils.lhand_assign(node.target.id, scope)
        assign = '%s = %s.value;\n' % (targ, temp_iter)
    else:
        assign = utils.deepleft(node.target, [], scope, '%s.value' % temp_iter).replace('\n', '\n    ')

    body = convert_block(node.body, scope)

    conv.kill_temp('iter')
    return FOR_TPL % (temp_iter, ible, temp_iter, assign, body)

IF_TPL = '''\
if ($b.bool(%(test)s) === true) {
%(contents)s
}%(more)s
'''

@converts(ast.If)
def _if(conv, node, scope):
    dct = {}
    dct['test'] = conv.convert_node(node.test, scope)
    dct['contents'] = conv.convert_block(node.body, scope)
    if node.orelse:
        if len(node.orelse) == 1:
            js = conv.convert_node(node.orelse[0], scope)
            dct['more'] = ' else ' + js
        else:
            js = conv.convert_block(node.orelse, scope)
            dct['more'] = ' else {\n%s\n}' % js
    else:
        dct['more'] = ''
    text = IF_TPL % dct
    return text

TRY_TPL = '''try {
%s
} catch (%s) {
    %s
}
'''

@converts(ast.TryExcept)
def _tryexcept(conv, node, scope):
    imports = []
    single = '''%s{
    %s
    }'''
    body = conv.convert_block(node.body, scope)
    subs = []
    temp = conv.get_temp('err')
    for handler in node.handlers:
        eb = ''
        if handler.name is not None:
            name = utils.lhand_assign(handler.name.id, scope)
            eb = '    %s = %s;\n    ' % (name, temp)
        eb_ = conv.convert_block(handler.body, scope)
        eb += eb_

        if handler.type is not None:
            t = conv.convert_node(handler.type, scope)
            top = 'if (%s.__class__ && $b.isinstance(%s, %s)) ' % (temp, temp, t)
        else:
            top = ''

        subs.append(single % (top, eb))
    text = TRY_TPL % (body, ' else '.join(subs))
    return text

# vim: et sw=4 sts=4
