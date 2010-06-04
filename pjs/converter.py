#!/usr/bin/env python

class Scope:
    default_globals = ['__name__', '__doc__', '__file__']

    def __init__(self, other=None):
        self.globals = Scope.default_globals[:]
        self.locals = self.globals
        self.explicit_globals = []
        self.parent_locals = []
        self.explicit_locals = 0
        self.num_iters = 0
        self.in_atomic = False
        if other and isinstance(other, Scope):
            self.__dict__ = other.__dict__.copy()

    def copy(self):
        return Scope(self)

class Converter:
    handlers = {}
    indent = 4
    defaults = {
        'indent': 4,
        'ignore_import_errors': False,
    }

    @classmethod
    def register(cls, nodeType):
        '''Decorator helper; returns a decorator for ast.NodeType, which should decorate a callable
        that accepts:
            @param conv: converter instance
            @param node: the current node
            @param scope: the current scope
        '''
        def meta(fn):
            cls.handlers[nodeType] = fn
        return meta

    def __init__(self, filename, **kwargs):
        self.startfile = os.path.abspath(filename)
        self.options = self.defaults.copy()
        self.options.update(kwargs)

        self.temps = {}
        self.to_process = [filename]

    def parse(self):
        modules = {}
        while len(self.to_process):
            filename = self.to_process.pop()
            modules[filename] = self.convert_module(filename)
        return modules

    ## Deal with temporary variables
    def get_temp(self, ttype):
        self.temps[ttype] = self.temps.get(ttype, 0) + 1
        return '__pjs_%s_%d' % (ttype, self.temps[ttype])

    def kill_temp(self, ttype):
        self.temps[ttype] -= 1

    ## Conversion funcs
    def convert_module(self, filename):
        text = open(filename).read()
        node = ast.parse(text, filename)
        dct = {
            'filename': filename,
            'doc': utils.multiline(ast.get_docstring, False),
        }
        scope = Scope()
        contents = self.convert_block(node.body, scope)
        contents = utils.fix_undef(contents, scope, True)
        dct['contents'] = content
        return MODULE_TEMPLATE % dct

    def convert_block(self, nodes, scope):
        text = ''.join(self.convert_node(child, scope) for child in nodes).strip()
        return '\n'.join(' '*self.options['indent'] + line for line in text.split('\n'))

    def convert_node(self, node, scope):
        if self.handlers.has_key(node.__class__):
            return self.handlers[node.__class__](self, node, scope)
        raise PJsNotImplemented("Conversion for node type %s is not yet supported." % node.__class__, node)
    
    def get_converter(self, what):
        if hasattr(what, '__class__'):
            what = what.__class__
        return self.handlers[what]

register = Converter.register
