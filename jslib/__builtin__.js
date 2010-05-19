/**
Copyright 2010 Jared Forsyth <jared@jareforsyth.com>

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.

**/

/**
Now you can import stuff...just like in python.
**/

var __not_implemented__ = function __not_implemented__(name) {
    return function not_implemented() {
        if (arguments.callee.__name__)
            name = arguments.callee.__name__;
        __globals__.raise(__builtins__.NotImplemented("the builtin function "+name+" is not implemented yet. You should help out and add it =)"));
    };
};

module('<builtin>/sys.py', function sys_module(__globals__) {
    __globals__.__doc__ = "The PJs module responsible for system stuff";
    __globals__.modules = {'sys':__globals__}; // sys and __builtin__ won't be listed
                             // it doesn't make sense for them to be
                             // reloadable.
    __globals__.path = ['.', '<builtin>'];
    __globals__.exit = $m({'code':0}, function exit(code) {
        __globals__.raise("SystemExit: sys.exit() was called with code "+code);
    });
});

module('<builtin>/os/path.py', function os_path_module(__globals__) {
    __globals__.__doc__ = "a module for dealing with paths";
    __globals__.join = $m({}, true, function join(first, args) {
        var path = first;
        for (var i=0;i<args.length;i++) {
            if (__globals__.isabs(args[i])) {
                path = args[i];
            } else if (path === '' || '/\\:'.indexOf(path.slice(-1)) !== -1) {
                path += args[i];
            } else
                path += '/' + args[i];
        }
        return path;
    });
    __globals__.isabs = $m(function isabs(path) {
        if (!path)return false;
        return path && path[0] == '/';
    });
    __globals__.abspath = $m(function abspath(path) {
        if (!__globals__.isabs(path))
            __globals__.raise("not implementing this atm");
        return __globals__.normpath(path);
    });
    __globals__.dirname = $m(function dirname(path) {
        return path.split('/').slice(0,-1).join('/') || '/';
    });
    __globals__.basename = $m(function basename(path) {
        return path.split('/').slice(-1)[0];
    });
    __globals__.normpath = $m(function normpath(path) {
        var prefix = path.match(/^\/+/) || '';
        var comps = path.slice(prefix.length).split('/');
        var i = 0;
        while (i < comps.length) {
            if (comps[i] == '.')
                comps = comps.slice(0, i).concat(comps.slice(i+1));
            else if (comps[i] == '..' && i > 0 && comps[i-1] && comps[i-1] != '..') {
                comps = comps.slice(0, i-1).concat(comps.slice(i+1));
                i -= 1;
            } else if (comps[i] == '' && i > 0 && comps[i-1] != '') {
                comps = comps.slice(0, i).concat(comps.slice(i+1));
            } else
                i += 1
        }
        if (!prefix && !comps)
            comps.push('.');
        return prefix + comps.join('/');
    });
});

/**
function pathresolve(path) {
    if (path[-1] !== '/') path += '/';
    if (path.find('/./') !== -1)
        return pathresolve(path.replace('/./', '/'));
    if (path.find('/../') !== -1)
        return pathresolve(path.replace(/(\/[^\/]+\/)..\//, '\1'));
    return path;
}

function dirname(path) {
    return path.split('/').slice(0, -1).join('/');
}
**/

module('<builtin>/__builtin__.py', function builting_module(__globals__) {

    var sys = __module_cache['<builtin>/sys.py']._module;

    __globals__.__doc__ = 'Javascript corrospondences to python builtin functions';

    /** importing modules **/
    __globals__.__import__ = $m({'file':'','from':''},
      function __import__(name, from, file) {
        if (defined(sys.modules[name]))
            return sys.modules[name];
        var path = __module_cache['<builtin>/os/path.py']._module;
        var relflag = false;
        var foundat = null;
        for (var i=0;i<sys.path.length;i++) {
            relflag = sys.path[i][0] !== '/' && sys.path[i].indexOf('<builtin>') !== 0;
            if (relflag)
                var dname = path.normpath(path.join(path.dirname(file), sys.path[i]));
            else
                var dname = sys.path[i];
            var fname = path.join(dname, name.replace('.', '/')+'.py');
            if (defined(__module_cache[fname])) {
                foundat = fname;
                break;
            }
        }
        if (!foundat)
            __globals__.raise("ImportError: no module named "+name);
        if (relflag) {
            var mname = [from.split('.').slice(0,-1)].concat([name]).join('.');
            if (mname[0] == '.')mname = mname.slice(1);
        } else
            var mname = name;
        if (!defined(sys.modules[mname])) {
            sys.modules[mname] = {}
            __module_cache[foundat].load(mname, sys.modules[mname]);
        }
        return sys.modules[mname];
    });

    __globals__.reload = $m(function reload(module) {
        delete sys.modules[module.__name__];
        // TODO: this could cause problems, not providing a source file or
        // source name...import might not go through
        return __globals__.__import__(module.__name__);
    });

    /** basic value types **/

    __globals__.dict = Class('dict', [], {
        // **TODO** add a **kwargs to this
        __init__: $m({'itable':{}}, function __init__(self, itable){
            self._items = {};
            if (!itable.__class__) {
                if (!(itable instanceof Object))
                    __globals__.raise(__globals__.ValueError('arg cannot be coerced to a dict'));
                for (var k in itable) {
                    self._items[k] = itable[k];
                }
            } else if (__globals__.isinstance(itable, __globals__.dict)) {
                var keys = itable.keys();
                for (var i=0;i<keys.__len__();i++){
                    self._items[key] = itable.__getitem__(keys.__getitem__(i));
                }
            } else {
                var args = __globals__.iter(itable);
                while (true) {
                    try {
                        var kv = args.next();
                        self._items[kv[0]] = kv[1];
                    } catch(e) {
                        if (__globals__.isinstance(e, __globals__.StopIteration))
                            break;
                        throw e;
                    }
                }
            }
        }),
        __cmp__: $m(function __cmp__(self, other){
            throw __globals__.AttributeError('not yet implemented');
        }),
        __contains__: $m(function __contains__(self, key){
            return key in self._items;
        }),
        __delattr__: $m(function __delattr__(self, key){
            if (key in self._items)
                delete self._items[key];
            else
                __globals__.raise(__globals__.KeyError(key+' not found'));
        }),
        __delitem__: $m(function __delitem__(self, key){
            __globals__.raise(__globals__.KeyError('doesnt make sense'));
        }),
        __doc__: 'builtin dictionary type',
        __eq__: $m(function __eq__(self, dct){
            var mk = self.keys();
            var ok = dct.keys();
            if (!mk.__eq__(ok))return false;
            for (var i=0;i<mk.__len__();i++) {
                if (!__globals__.eq(self.__getitem__(mk.__getitem__(i)),
                        dct.__getitem__(mk.__getitem__(i))))
                    return false;
            }
            return true;
        }),
        __format__: __not_implemented__('format'),
        __ge__: __not_implemented__('ge'),
        __hash__: null,
        __iter__: $m(function __iter__(self) {
            return self.keys().__iter__();
        }),
        __len__: $m(function __len__(self){
            return self.keys().__len__();
        }),
        __repr__: $m(function __repr__(self){
            return self.__str__();
        }),
        __setitem__: $m(function __setitem__(self, key, value){
            self._items[key] = value;
        }),
        __str__: $m(function __str__(self){
            var strs = [];
            for (var key in self._items) {
                strs.push(__globals__.repr(key)+':'+__globals__.repr(self._items[key]));
            }
            return '{'+strs.join(', ')+'}';
        }),
        clear: $m(function clear(self){
            delete self._items;
            self._items = {};
        }),
        copy: $m(function copy(self){
            return __globals__.dict(self);
        }),
        fromkeys: classmethod($m({'v':null}, function fromkeys(cls, keys, v){
            var d = cls();
            var keys = __globals__.iter(keys);
            while (true) {
                try {
                    d.__setitem__(keys.next(), v);
                } catch(e) {
                    if (__globals__.isinstance(e, __globals__.StopIteration))
                        break
                    throw e;
                }
            }
            return d;
        })),
        get: $m({'def':null}, function get(self, key, def){
            if (key in self._items)
                return self._items[key];
            return def;
        }),
        has_key: $m(function has_key(self, key){
            return key in self._items;
        }),
        items: $m(function items(self){
            var items = [];
            var keys = self.keys().as_js();
            for (var i=0;i<keys.length;i++){
                items.push([keys[i], self._items[keys[i]]]);
            }
            return __globals__.list(items);
        }),
        iteritems: $m(function iteritems(self){
            // TODO: nasty hack...doesn't actually get you any lazy benefits
            return self.items().__iter__();
        }),
        iterkeys: $m(function iterkeys(self){
            return self.keys().__iter__();
        }),
        itervalues: $m(function itervalues(self){
            return self.values().__iter__();
        }),
        keys: $m(function keys(self){
            var ks = [];
            for (var k in self._items){
                ks.push(k);
            }
            return __globals__.list(ks);
        }),
        pop: $m({'default_':null}, function pop(self, key, default_){
            if (key in self._items){
                var v = self._items[key];
                delete self._items[key];
                return v;
            }
            return default_;
        }),
        popitem: $m(function popitem(self){
            if (self.__len__()==0)
                throw __globals__.KeyError('dict is empty');
            for (var k in self._items) {
                return self.pop(k);
            }
        }),
        setdefault: $m(function setdefault(self, k, d){
            if (!(k in self._items))
                self._items[k] = d;
            return self._items[k];
        }),
        update: $m(function update(self, other){
            var keys = __globals__.dict(other).keys().as_js();
            for (var i=0;i<keys.length;i++){
                self._items[keys[i]] = other.__getitem__(keys[i]);
            }
        }),
        values: $m(function values(self){
            var vs = [];
            for (var k in self._items)
                vs.push(self._items[k]);
            return __getitem__.list(vs);
        }),
    });

    __globals__.unicode = __not_implemented__("unicode");
    __globals__.bytearray = __not_implemented__("bytearray");
    __globals__.object = __not_implemented__("object");
    __globals__.complex = __not_implemented__("complex");

    __globals__.bool = $m(function bool(what) {
        if (defined(what.__bool__))
            return what.__bool__();
        if (what)
            return true;
        return false;
    });

    __globals__._int = $m(function _int(what) {
        if (typeof(what) === 'string')
            return parseInt(what);
        else if (typeof(what) === 'number') return what;
        else
            throw __globals__.TypeError('can\'t coerce to int');
    });

    __globals__.tuple = Class('tuple', [], {
        __init__: $m({'ible':[]}, function __init__(self, ible) {
            if (ible instanceof Array) {
                self._len = ible.length;
                self._list = ible.slice();
            } else if (__globals__.isinstance(ible, [__globals__.tuple, __globals__.list])) {
                self._list = ible.as_js().slice();
                self._len = self._list.length;
            } else {
                var __ = __globals__.iter(ible);
                self._list = [];
                self._len = 0;
                while (__.trynext() && self._list.push(__.next())){self._len++}
            }
        }),
        as_js: $m(function as_js(self){
           return self._list;
        }),
        __add__: $m(function __add__(self, other) {
            if (!__globals__.isinstance(other, __globals__.tuple))
                throw __globals__.TypeError('can only concatenate tuple to tuple');
            return __globals__.tuple(self._list.concat(other._list));
        }),
        __contains__: $m(function __contains__(self, one){
            return self._list.indexOf(one) !== -1;
        }),
        __doc__: 'javascript equivalent of the python builtin tuble class',
        __eq__: $m(function __eq__(self, other){
            if (!__globals__.isinstance(other, __globals__.tuple))
                return false;
            if (self.__len__() !== other.__len__()) return false;
            var ln = self.__len__();
            for (var i=0;i<ln;i++) {
                if (!__globals__.eq(self._list[i], other._list[i]))
                    return false;
            }
            return true;
        }),
        __ge__: __not_implemented__('nope'),
        __getitem__: $m(function __getitem__(self, index) {
            if (index < 0) index += self._len;
            if (index < 0 || index >= self._len)
                throw __globals__.IndexError('index out of range');
            return self._list[index];
        }),
        __getnewargs__: __not_implemented__('sorry'),
        __getslice__: $m(function __getslice__(self, a, b) {
            return __globals__.tuple(self._list.slice(a,b));
        }),
        __gt__: __not_implemented__(''),
        __hash__: __not_implemented__(''),
        __iter__: $m(function __iter__(self) {
            return __globals__.tupleiterator(self);
        }),
        __le__: __not_implemented__(''),
        __len__: $m(function __len__(self) { return self._len; }),
        __lt__: __not_implemented__(''),
        __mul__: $m(function __mul__(self, other) {
            if (__globals__.isinstance(other, __globals__._int))
                other = other.as_js();
            if (type(other) == 'number') {
                var res = []
                for (var i=0;i<other;i++) {
                    res = res.concat(self.as_js());
                }
                return __globals__.tuple(res);
            }
            throw __globals__.TypeError('only can multiply by a number');
        }),
        __ne__: __not_implemented__(''),
        __repr__: $m(function __repr__(self) { return self.__str__(); }),
        __rmul__: $m(function __rmul__(self, other) {
            return self.__mul__(other);
        }),
        count: $m(function count(self, value) {
            var c = 0;
            for (var i=0;i<self._len;i++) {
                if (__globals__.eq(self._list[i], value))
                    c++;
            }
            return c;
        }),
        index: $m(function index(self, value) {
            for (var i=0;i<self._len;i++) {
                if (__globals__.eq(self._list[i], value))
                    return i;
            }
            __globals__.raise(__globals__.ValueError('x not in list'));
        }),
        __str__: $m(function __str__(self) {
            var a = [];
            for (var i=0;i<self._len;i++) {
                a.push(__globals__.repr(self._list[i]));
            }
            if (a.length == 1) {
                return '('+a[0]+',)';
            }
            return '('+a.join(', ')+')';
        }),
    });

    __globals__.frozenset = __not_implemented__("frozenset");
    __globals__.hash = __not_implemented__("hash");
    __globals__._float = __not_implemented__("float");
    __globals__._long = __not_implemented__("long");
    __globals__.basestring = __not_implemented__("basestring");
    __globals__.eq = $m(function eq(a, b){
        if (a.__eq__) {
            try { return a.__eq__(b); }
            catch(e) {
                if (!__globals__.isinstance(e, __globals__.NotImplemented))
                    throw e;
            }
        }
        if (b.__eq__) {
            try { return b.__eq__(a); }
            catch(e) {
                if (!__globals__.isinstance(e, __globals__.NotImplemented))
                    throw e;
            }
        }
        return a === b;
    });

    __globals__.str = $m(function str(item) {
        if (item.__type__ === 'type')
            return item.__module__ + '.' + item.__name__;
        else if (item.__class__ && !defined(item.__str__))
            return '<' + item.__class__.__module__ + '.' + item.__class__.__name__
                       + ' instance at 0x10beef01>';
        if (defined(item.__str__)) {
            return item.__str__();
        } else if (item instanceof Array) {
            var m = [];
            for (var i=0;i<item.length;i++) {
                m.push(__globals__.repr(item[i]));
            }
            return '[:'+m.join(', ')+':]';
        } else if (item instanceof Function) {
            if (!item.__name__) {
                if (!item.__module__)
                    return '<anonymous function...>';
                else
                    return '<anonymous function in module "' + item.__module__ + '">';
            } else {
                if (!item.__module__)
                    return '<function '+item.__name__+'>';
                else
                    return '<function '+item.__name__+' from module '+item.__module__+'>';
            }
        } else if (typeof(item) === 'object') {
            var m = [];
            for (var a in item) {
                m.push("'"+a+"': "+__globals__.repr(item[a]));
            }
            return '{'+m.join(', ')+'}';
        } else {
            return ''+item;
        }
    });

    __globals__.list = Class('list', [], {
        __init__: $m({'ible':[]}, function __init__(self, ible) {
            if (ible instanceof Array) {
                self._list = ible.slice();
            } else if (__globals__.isinstance(ible, [__globals__.tuple, __globals__.list])) {
                self._list = ible.as_js().slice();
            } else {
                var __ = __globals__.iter(ible);
                self._list = [];
                while (__.trynext() && self._list.push(__.next())){}
            }
        }),
        as_js: $m(function as_js(self){
           return self._list;
        }),
        __add__: $m(function __add__(self, other) {
            if (!__globals__.isinstance(other, __globals__.list))
                throw __globals__.TypeError('can only concatenate tuple to tuple');
            return __globals__.tuple(self._list.concat(other._list));
        }),
        __contains__: $m(function __contains__(self, one){
            return self._list.indexOf(one) !== -1;
        }),
        __delitem__: $m(function __delitem__(self, i) {
            self._list = self._list.slice(0, i).concat(self._list.slice(i+1));
        }),
        __delslice__: $m(function __delslice__(self, a, b) {
            self._list = self._list.slice(0, a).concat(self._list.slice(b));
        }),
        __doc__: 'javascript equivalent of the python builtin list class',
        __eq__: $m(function __eq__(self, other){
            if (!__globals__.isinstance(other, __globals__.list))
                return false;
            if (self.__len__() !== other.__len__()) return false;
            var ln = self.__len__();
            for (var i=0;i<ln;i++) {
                if (!__globals__.eq(self._list[i], other._list[i]))
                    return false;
            }
            return true;
        }),
        __ge__: __not_implemented__('ge'),
        __getitem__: $m(function __getitem__(self, index) {
            if (index < 0) index += self._list.length;
            if (index < 0 || index >= self._list.length)
                throw __globals__.IndexError('index out of range');
            return self._list[index];
        }),
        __getslice__: $m(function __getslice__(self, a, b) {
            return __globals__.list(self._list.slice(a,b));
        }),
        __gt__: __not_implemented__(''),
        __iadd__: $m(function __iadd__(self, other) {
            if (!__globals__.isinstance(other, __globals__.list))
                __builtins__.raise(__globals__.TypeError('can only add list to list'));
            self._list = self._list.concat(other._list);
        }),
        __imul__: $m(function __imul__(self, other) {
            if (__globals__.isinstance(other, __globals__._int))
                other = other.as_js();
            if (type(other) != 'number')
                throw __globals__.TypeError('only can multiply by a number');
            var res = []
            for (var i=0;i<other;i++) {
                res = res.concat(self.as_js());
            }
            self._list = res;
        }),
        __iter__: $m(function __iter__(self) {
            return __globals__.listiterator(self);
        }),
        __le__: __not_implemented__(''),
        __len__: $m(function __len__(self) { return self._list.length; }),
        __lt__: __not_implemented__(''),
        __mul__: $m(function __mul__(self, other) {
            if (__globals__.isinstance(other, __globals__._int))
                other = other.as_js();
            if (type(other) == 'number') {
                var res = []
                for (var i=0;i<other;i++) {
                    res = res.concat(self.as_js());
                }
                return __globals__.list(res);
            }
            throw __globals__.TypeError('only can multiply by a number');
        }),
        __ne__: __not_implemented__(''),
        __repr__: $m(function __repr__(self) { return self.__str__(); }),
        __reversed__: $m(function __reversed__(self) {
            return __globals__.listreversediterator(self);
        }),
        __rmul__: $m(function __rmul__(self, other) {
            return self.__mul__(other);
        }),
        __setitem__: $m(function __setitem__(self, i, val) {
            if (i < 0) i += self._list.length;
            if (i < 0 || i >= self._list.length)
                __globals__.raise(__globals__.IndexError('list index out of range'));
            self._list[i] = val;
        }),
        __setslice__: $m(function __setslice__(self, i, j, val) {
            var it = __globals__.list(val)._list;
            self._list = self._list.slice(0, i).concat(it).concat(self._list.slice(j));
        }),
        append: $m(function append(self, what){
            self._list.push(what);
        }),
        count: $m(function count(self, value) {
            var c = 0;
            for (var i=0;i<self._list.length;i++) {
                if (__globals__.eq(self._list[i], value))
                    c++;
            }
            return c;
        }),
        extend: $m(function extend(self, what) {
            self.__iadd__(__globals__.list(what));
        }),
        index: $m(function index(self, value) {
            for (var i=0;i<self._list.length;i++) {
                if (__globals__.eq(self._list[i], value))
                    return i;
            }
            __globals__.raise(__globals__.ValueError('x not in list'));
        }),
        insert: $m(function insert(self, i, val) {
            self._list = self._list.slice(0, i).concat([val]).concat(self._list.slice(i));
        }),
        pop: $m({'i':-1}, function pop(self, i) {
            if (i < 0) i += self._list.length;
            if (i < 0 || i >= self._list.length)
                __builtins__.raise(__globals__.IndexError('pop index out of range'));
            var val = self._list[i];
            self.__delitem__(i);
            return val;
        }),
        remove: $m(function(self, val) {
            var i = self.index(val);
            self.__delitem__(i);
        }),
        reverse: $m(function(self, val) {
            var ol = self._list;
            self._list = [];
            for (var i=ol.length-1;i>=0;i--)
                self._list.push(ol[i]);
        }),
        sort: $m({'cmp':null, 'key':null, 'reverse':false}, function (self, cmp, key, reverse) {
            throw new Error('not impl');
        }),
        __str__: $m(function __str__(self) {
            var a = [];
            for (var i=0;i<self._list.length;i++) {
                a.push(__globals__.repr(self._list[i]));
            }
            return '['+a.join(', ')+']';
        }),
    });

    __globals__.listiterator = Class('listiterator', [], {
        __init__: $m(function(self, lst) {
            self.lst = lst;
            self.at = 0;
            self.ln = lst._list.length;
        }),
        __iter__: $m(function(self){
            return self;
        }),
        trynext: $m(function(self){
            return self.at < self.lst._list.length;
        }),
        next: $m(function(self) {
            if (self.at >= self.lst._list.length)
                __globals__.raise(__globals__.StopIteration());
            var val = self.lst._list[self.at];
            self.at += 1;
            return val;
        }),
    });

    __globals__.listreversediterator = Class('listreversediterator', [__globals__.listiterator], {
        next: $m(function(self) {
            if (self.at > self.lst._list.length)
                __globals__.raise(__globals__.StopIteration());
            var val = self.lst._list[self.lst._list.length-1-self.at];
            self.at += 1;
            return val;
        }),
    });

    __globals__.tupleiterator = Class('tupleiterator', [__globals__.listiterator], {});

    __globals__.iter = $m({'sentinel':null}, function iter(ible, sentinel) {
        if (sentinel)
            return callable_iterator(ible, sentinel);
        if (ible instanceof Array) 
            return __globals__.tuple(ible).__iter__();
        if (!defined(ible.__iter__))
            __globals__.raise('item not iterable');
        return ible.__iter__();
    });

    /** function progging **/

    __globals__.all = __not_implemented__("all");
    __globals__.vars = $m(function vars(obj) {
        var dct = {};
        for (var a in obj) {
            dct[a] = obj[a];
        }
        return dct;
    });

    /** inheritence **/

    __globals__.type = type;
    __globals__.classmethod = classmethod;
    __globals__.staticmethod = staticmethod;

    __globals__.isinstance = $m(function isinstance(inst, clsses) {
        if (!defined(inst.__class__))
            __globals__.raise("PJs Error: isisntance only works on objects");
        return __globals__.issubclass(inst.__class__, clsses);
    });

    __globals__.issubclass = $m(function issubclass(cls, clsses) {
        if (!defined(cls.__bases__))
            __globals__.raise("PJs Error: issubclass only works on classes");
        if (!(clsses instanceof Array))
            clsses = [clsses];
        for (var i=0;i<clsses.length;i++) {
            if (cls === clsses[i]) return true;
            for (var a=0;a<cls.__bases__.length;a++) {
                if (__globals__.issubclass(cls.__bases__[a], clsses))
                    return true;
            }
        }
        return false;
    });

    __globals__.help = __not_implemented__("help");

    __globals__.copyright = 'something should go here...';

    __globals__.input = __not_implemented__("input");
    __globals__.oct = __not_implemented__("oct");
    __globals__.bin = __not_implemented__("bin");
    __globals__.SystemExit = __not_implemented__("SystemExit");
    __globals__.format = __not_implemented__("format");
    __globals__.sorted = __not_implemented__("sorted");
    __globals__.False = __not_implemented__("False");
    __globals__.__package__ = __not_implemented__("__package__");
    __globals__.round = __not_implemented__("round");
    __globals__.dir = __not_implemented__("dir");
    __globals__.cmp = __not_implemented__("cmp");
    __globals__.set = __not_implemented__("set");
    __globals__.bytes = __not_implemented__("bytes");
    __globals__.reduce = __not_implemented__("reduce");
    __globals__.intern = __not_implemented__("intern");
    __globals__.Ellipsis = __not_implemented__("Ellipsis");
    __globals__.locals = __not_implemented__("locals");
    __globals__.slice = __not_implemented__("slice");
    __globals__.sum = __not_implemented__("sum");
    __globals__.getattr = __not_implemented__("getattr");
    __globals__.abs = __not_implemented__("abs");
    __globals__.exit = __not_implemented__("exit");
    __globals__.print = $m({}, true, function _print(args) {
        var strs = [];
        for (var i=0;i<args.length;i++) {
            strs.push(__globals__.str(args[i]));
        }
        print(strs.join(' '));
    });
    __globals__.print.__name__ = 'print';
    __globals__.assert = $m(function assert(bool, text) {
        if (!bool) {
            throw Error(text);
        }
    });
    __globals__._debug_stack = [];
    __globals__.raise = $m(function raise(obj) {
        obj.stack = __globals__._debug_stack.slice();
        throw obj;
    });
    __globals__.True = true;
    __globals__.None = null;
    __globals__.len = $m(function len(obj) {
        if (obj instanceof Array) return obj.length;
        if (obj instanceof String) return obj.length;
        if (obj.__len__) return obj.__len__();
        __globals__.raise(__globals__.TypeError('no function __len__'));
    });
    __globals__.credits = __not_implemented__("credits");
    __globals__.ord = __not_implemented__("ord");
    // __globals__.super = __not_implemented__("super");
    __globals__.license = __not_implemented__("license");
    __globals__.KeyboardInterrupt = __not_implemented__("KeyboardInterrupt");
    __globals__.filter = __not_implemented__("filter");
    __globals__.range = __not_implemented__("range");
    __globals__.BaseException = __not_implemented__("BaseException");
    __globals__.pow = __not_implemented__("pow");
    __globals__.globals = __not_implemented__("globals");
    __globals__.divmod = __not_implemented__("divmod");
    __globals__.enumerate = __not_implemented__("enumerate");
    __globals__.apply = __not_implemented__("apply");
    __globals__.open = __not_implemented__("open");
    __globals__.quit = __not_implemented__("quit");
    __globals__.zip = __not_implemented__("zip");
    __globals__.hex = __not_implemented__("hex");
    __globals__.next = __not_implemented__("next");
    __globals__.chr = __not_implemented__("chr");
    __globals__.xrange = __not_implemented__("xrange");


    __globals__.reversed = __not_implemented__("reversed");
    __globals__.hasattr = __not_implemented__("hasattr");
    __globals__.delattr = __not_implemented__("delattr");
    __globals__.setattr = __not_implemented__("setattr");
    __globals__.raw_input = __not_implemented__("raw_input");
    __globals__.compile = __not_implemented__("compile");

    __globals__.repr = $m(function repr(item) {
        if (typeof(item) === 'string') {
            return "'" + item + "'";
        } else if (defined(item.__repr__)) {
            return item.__repr__();
        } else return __globals__.str(item);
    });

    __globals__.property = __not_implemented__("property");
    __globals__.GeneratorExit = __not_implemented__("GeneratorExit");
    __globals__.coerce = __not_implemented__("coerce");
    __globals__.file = __not_implemented__("file");
    __globals__.unichr = __not_implemented__("unichr");
    __globals__.id = __not_implemented__("id");
    __globals__.min = __not_implemented__("min");
    __globals__.execfile = __not_implemented__("execfile");
    __globals__.any = __not_implemented__("any");
    __globals__.NotImplemented = __not_implemented__("NotImplemented");
    __globals__.map = __not_implemented__("map");
    __globals__.buffer = __not_implemented__("buffer");
    __globals__.max = __not_implemented__("max");
    __globals__.callable = __not_implemented__("callable");
    __globals__.eval = __not_implemented__("eval");
    __globals__.__debug__ = __not_implemented__("__debug__");

    __globals__.Exception = Class('Exception', [], {
        __init__: $m({}, true, function __init__(self, args) {
            self.args = args;
        }),
        __str__: $m(function __str__(self) {
            if (__globals__.len(self.args) == 1)
                return self.__class__.__name__+': '+__globals__.str(self.args[0]);
            return self.__class__.__name__+': '+__globals__.str(self.args);
        }),
    });

    __globals__.TypeError = Class('TypeError', [__globals__.Exception], {});
    __globals__.ValueError = Class('ValueError', [__globals__.Exception], {});
    __globals__.IndexError = Class('IndexError', [__globals__.Exception], {});
    __globals__.NotImplemented = Class('NotImplemented', [__globals__.Exception], {});
});

__module_cache['<builtin>/sys.py'].load('sys'); // must be loaded for importing to work.
__module_cache['<builtin>/os/path.py'].load('os.path');
var __builtins__ = __module_cache['<builtin>/__builtin__.py'].load('__builtin__');
var __import__ = __builtins__.__import__; // should I make this global?

