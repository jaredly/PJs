#!/usr/bin/env python

import ast

TEMPLATES = {
    'module':'''\
module(function %(name)s(%(mvar)s) {
    %(mvar)s.__doc__ = %(docs);
    %(contents)s
});
''',
}

def convert(filename):
    '''a function to cunvert python to javascript. uses python's ``ast`` module. returns
        (imports, js)

        imports is a list of modules to be imported, js is text of the converted javascript code
    '''
    text = open(filename).read()
    tree = ast.parse(text, filename)
    
    imports = []
    js = convert_module(tree, '__main__', imports)
    return imports, js

def convert_module(node, name, imports):
    mvar = '__globals__'
    dct = {'mvar':mvar, 'name':name}
    


class Converter(object):

    def __init__(self, startfile):
        text = open(startfile).read()
        self.tree = ast.parse(text, startfile)
        print self.tree, dir(self.tree)
        print self.tree.body
        doc = ast.get_docstring(self.tree)
        for node in self.tree.body:
            print node

def do_compile(filename):
    print Converter(filename)


# vim: et sw=4 sts=4
