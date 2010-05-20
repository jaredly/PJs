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
        _.raise(__builtins__.NotImplemented("the builtin function "+name+" is not implemented yet. You should help out and add it =)"));
    };
};

module('<builtin>/sys.py', function sys_module(_) {
    _.__doc__ = "The PJs module responsible for system stuff";
    _.modules = {'sys':_}; // sys and __builtin__ won't be listed
                             // it doesn't make sense for them to be
                             // reloadable.
    _.path = ['.', '<builtin>'];
    _.exit = $m({'code':0}, function exit(code) {
        _.raise("SystemExit: sys.exit() was called with code "+code);
    });
});

module('<builtin>/os/path.py', function os_path_module(_) {
    _.__doc__ = "a module for dealing with paths";
    _.join = $m({}, true, function join(first, args) {
        var path = first;
        for (var i=0;i<args._list.length;i++) {
            if (_.isabs(args._list[i])) {
                path = args._list[i];
            } else if (path === '' || '/\\:'.indexOf(path.slice(-1)) !== -1) {
                path += args._list[i];
            } else
                path += '/' + args._list[i];
        }
        return path;
    });
    _.isabs = $m(function isabs(path) {
        if (!path)return false;
        return path && path[0] == '/';
    });
    _.abspath = $m(function abspath(path) {
        if (!_.isabs(path))
            _.raise("not implementing this atm");
        return _.normpath(path);
    });
    _.dirname = $m(function dirname(path) {
        return path.split('/').slice(0,-1).join('/') || '/';
    });
    _.basename = $m(function basename(path) {
        return path.split('/').slice(-1)[0];
    });
    _.normpath = $m(function normpath(path) {
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

module('<builtin>/__builtin__.py', function builting_module(_) {

    var sys = __module_cache['<builtin>/sys.py']._module;

    _.__doc__ = 'Javascript corrospondences to python builtin functions';

    /** importing modules **/
    _.__import__ = $m({'file':'','from':''},
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
            _.raise("ImportError: no module named "+name);
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

    _.reload = $m(function reload(module) {
        delete sys.modules[module.__name__];
        // TODO: this could cause problems, not providing a source file or
        // source name...import might not go through
        return _.__import__(module.__name__);
    });

    /** basic value types **/

    _.dict = Class('dict', [], {
        // **TODO** add a **kwargs to this
        __init__: $m({'itable':{}}, function __init__(self, itable){
            self._keys = [];
            self._values = [];
            if (!itable.__class__) {
                if (itable instanceof Array) {
                    for (var i=0;i<itable.length;i++) {
                        self.__setitem__(itable[i][0], itable[i][1]);
                    }
                } else if (!(itable instanceof Object))
                    _.raise(_.ValueError('arg cannot be coerced to a dict'));
                else {
                    for (var k in itable) {
                        self.__setitem__(k, itable[k]);
                    }
                }
            } else if (_.isinstance(itable, _.dict)) {
                var keys = itable.keys();
                for (var i=0;i<keys.__len__();i++){
                    self.__setitem__(key, itable.__getitem__(keys.__getitem__(i)));
                }
            } else {
                var args = _.iter(itable);
                while (true) {
                    try {
                        var kv = args.next();
                        self.__setitem__(kv[0], kv[1]);
                    } catch(e) {
                        if (_.isinstance(e, _.StopIteration))
                            break;
                        throw e;
                    }
                }
            }
        }),
        as_js: $m(function as_js(self) {
            var dct = {}
            for (var i=0;i<self._keys.length;i++){
                dct[self._keys[i]] = self._values[i];
            }
            return dct;
        }),
        __cmp__: $m(function __cmp__(self, other){
            throw _.AttributeError('not yet implemented');
        }),
        __contains__: $m(function __contains__(self, key){
            return self._keys.indexOf(key) !== -1;
        }),
        __delitem__: $m(function __delattr__(self, key){
            var i = self._keys.indexOf(key);
            if (i !== -1) {
                self._keys = self._keys.slice(0, i).concat(self._keys.slice(i+1));
                self._values = self._values.slice(0, i).concat(self._values.slice(i+1));
            } else
                _.raise(_.KeyError(key+' not found'));
        }),
        __delattr__: $m(function __delitem__(self, key){
            _.raise(_.KeyError('doesnt make sense'));
        }),
        __doc__: 'builtin dictionary type',
        __eq__: $m(function __eq__(self, dct){
            var mk = self.keys();
            var ok = dct.keys();
            if (!mk.__eq__(ok))return false;
            for (var i=0;i<mk.__len__();i++) {
                if (!_.eq(self.__getitem__(mk.__getitem__(i)),
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
            var i = self._keys.indexOf(key);
            if (i !== -1) {
                self._values[i] = value;
            } else {
                self._keys.push(key);
                self._values.push(value);
            }
        }),
        __str__: $m(function __str__(self){
            var strs = [];
            for (var i=0;i<self._keys.length;i++){
                strs.push(_.repr(self._keys[i])+': '+_.repr(self._values[i]));
            }
            return _.str('{'+strs.join(', ')+'}');
        }),
        clear: $m(function clear(self){
            delete self._keys;
            delete self._values;
            self._keys = [];
            self._values = [];
        }),
        copy: $m(function copy(self){
            return _.dict(self);
        }),
        fromkeys: classmethod($m({'v':null}, function fromkeys(cls, keys, v){
            var d = cls();
            var keys = _.iter(keys);
            while (true) {
                try {
                    d.__setitem__(keys.next(), v);
                } catch(e) {
                    if (_.isinstance(e, _.StopIteration))
                        break
                    throw e;
                }
            }
            return d;
        })),
        get: $m({'def':null}, function get(self, key, def){
            var i = self._keys.indexOf(key);
            if (i !== -1)
                return self._values[i];
            return def;
        }),
        has_key: $m(function has_key(self, key){
            return self._keys.indexOf(key) !== -1;
        }),
        items: $m(function items(self){
            var items = [];
            for (var i=0;i<self._keys.length;i++) {
                items.push(_.list([self._keys[i], self._values[i]]));
            }
            return _.list(items);
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
            return _.list(self._keys.slice());
        }),
        pop: $m({'default_':null}, function pop(self, key, default_){
            var i = self._keys.indexOf(key);
            if (i !== -1) {
                var v = self._values[i];
                self.__delitem__(key);
                return v;
            }
            return default_;
        }),
        popitem: $m(function popitem(self){
            if (self.__len__()==0)
                throw _.KeyError('popitem(): dictionary is empty');
            return self.pop(self._keys[0]);
        }),
        setdefault: $m(function setdefault(self, k, d){
            if (!self.has_key(k))
                self.__setitem__(k, d);
            return self.__getitem__(k);
        }),
        update: $m(function update(self, other){
            var keys = _.dict(other).keys().as_js();
            for (var i=0;i<keys.length;i++){
                self.__setitem__(keys[i], other.__getitem__(keys[i]));
            }
        }),
        values: $m(function values(self){
            return __getitem__.list(self._values.slice());
        }),
    });

    _.unicode = __not_implemented__("unicode");
    _.bytearray = __not_implemented__("bytearray");
    _.object = __not_implemented__("object");
    _.complex = __not_implemented__("complex");

    _.bool = $m(function bool(what) {
        if (defined(what.__bool__))
            return what.__bool__();
        if (what)
            return true;
        return false;
    });

    _._int = $m(function _int(what) {
        if (typeof(what) === 'string')
            return parseInt(what);
        else if (typeof(what) === 'number') return what;
        else
            throw _.TypeError('can\'t coerce to int');
    });

    _.tuple = Class('tuple', [], {
        __init__: $m({'ible':[]}, function __init__(self, ible) {
            if (ible instanceof Array) {
                self._len = ible.length;
                self._list = ible.slice();
            } else if (_.isinstance(ible, [_.tuple, _.list])) {
                self._list = ible.as_js().slice();
                self._len = self._list.length;
            } else {
                var __ = _.iter(ible);
                self._list = [];
                self._len = 0;
                while (__.trynext() && self._list.push(__.next())){self._len++}
            }
        }),
        as_js: $m(function as_js(self){
           return self._list;
        }),
        __add__: $m(function __add__(self, other) {
            if (!_.isinstance(other, _.tuple))
                throw _.TypeError('can only concatenate tuple to tuple');
            return _.tuple(self._list.concat(other._list));
        }),
        __contains__: $m(function __contains__(self, one){
            return self._list.indexOf(one) !== -1;
        }),
        __doc__: 'javascript equivalent of the python builtin tuble class',
        __eq__: $m(function __eq__(self, other){
            if (!_.isinstance(other, _.tuple))
                return false;
            if (self.__len__() !== other.__len__()) return false;
            var ln = self.__len__();
            for (var i=0;i<ln;i++) {
                if (!_.eq(self._list[i], other._list[i]))
                    return false;
            }
            return true;
        }),
        __ge__: __not_implemented__('nope'),
        __getitem__: $m(function __getitem__(self, index) {
            if (index < 0) index += self._len;
            if (index < 0 || index >= self._len)
                throw _.IndexError('index out of range');
            return self._list[index];
        }),
        __getnewargs__: __not_implemented__('sorry'),
        __getslice__: $m(function __getslice__(self, a, b) {
            return _.tuple(self._list.slice(a,b));
        }),
        __gt__: __not_implemented__(''),
        __hash__: __not_implemented__(''),
        __iter__: $m(function __iter__(self) {
            return _.tupleiterator(self);
        }),
        __le__: __not_implemented__(''),
        __len__: $m(function __len__(self) { return self._len; }),
        __lt__: __not_implemented__(''),
        __mul__: $m(function __mul__(self, other) {
            if (_.isinstance(other, _._int))
                other = other.as_js();
            if (type(other) == 'number') {
                var res = []
                for (var i=0;i<other;i++) {
                    res = res.concat(self.as_js());
                }
                return _.tuple(res);
            }
            throw _.TypeError('only can multiply by a number');
        }),
        __ne__: __not_implemented__(''),
        __repr__: $m(function __repr__(self) { return self.__str__(); }),
        __rmul__: $m(function __rmul__(self, other) {
            return self.__mul__(other);
        }),
        count: $m(function count(self, value) {
            var c = 0;
            for (var i=0;i<self._len;i++) {
                if (_.eq(self._list[i], value))
                    c++;
            }
            return c;
        }),
        index: $m(function index(self, value) {
            for (var i=0;i<self._len;i++) {
                if (_.eq(self._list[i], value))
                    return i;
            }
            _.raise(_.ValueError('x not in list'));
        }),
        __str__: $m(function __str__(self) {
            var a = [];
            for (var i=0;i<self._len;i++) {
                a.push(_.repr(self._list[i]));
            }
            if (a.length == 1) {
                return _.str('('+a[0]+',)');
            }
            return _.str('('+a.join(', ')+')');
        }),
    });

    _.frozenset = __not_implemented__("frozenset");
    _.hash = __not_implemented__("hash");
    _._float = __not_implemented__("float");
    _._long = __not_implemented__("long");
    _.basestring = __not_implemented__("basestring");
    _.eq = $m(function eq(a, b){
        if (a.__eq__) {
            try { return a.__eq__(b); }
            catch(e) {
                if (!_.isinstance(e, _.NotImplemented))
                    throw e;
            }
        }
        if (b.__eq__) {
            try { return b.__eq__(a); }
            catch(e) {
                if (!_.isinstance(e, _.NotImplemented))
                    throw e;
            }
        }
        if (a instanceof Array && b instanceof Array) {
            if (a.length!==b.length) return false;
            for (var i=0;i<a.length;i++) {
                if (!_.eq(a[i], b[i]))
                    return false;
            }
            return true;
        }
        return a === b;
    });

    _.str = Class('str', [], {
        __init__: $m({'item':''}, function __init__(self, item) {
            if (typeof(item) === 'string')
                self._data = item;
            else if (typeof(item) === 'number')
                self._data = ''+item;
            else if (defined(item.__str__))
                self._data = item.__str__()._data;
            else if (item.__type__ === 'type')
                self._data = "<class '" + item.__module__ + '.' + item.__name__ + "'>";
            else if (item.__class__)
                self._data = '<' + item.__class__.__module__ + '.' + item.__class__.__name__
                                + ' instance at 0xbeaded>';
            else if (item instanceof Array) {
                var m = [];
                for (var i=0;i<item.length;i++) {
                    m.push(_.repr(item[i]));
                }
                self._data = '[:'+m.join(', ')+':]';
            } else if (item instanceof Function) {
                if (!item.__name__) {
                    if (item.name)
                        self._data = '<javascript function "' + item.name + "'>'";
                    else if (!item.__module__)
                        self._data = '<anonymous function...>';
                    else
                        self._data = '<anonymous function in module "' + item.__module__ + '">';
                } else {
                    if (!item.__module__)
                        self._data = '<function '+item.__name__+'>';
                    else
                        self._data = '<function '+item.__name__+' from module '+item.__module__+'>';
                }
            } else if (typeof(item) === 'object') {
                var m = [];
                for (var a in item) {
                    m.push("'"+a+"': "+_.repr(item[a]));
                }
                self._data = '{'+m.join(', ')+'}';
            } else {
                self._data = ''+item;
            }
        }),
        __add__: $m(function __add__(self, other) {
            if (_.isinstance(other, _.str))
                return _.str(self._data + other._data);
            if (typeof(other) === 'string')
                return _.str(self._data + other);
        }),
        __contains__: $m(function __contains__(self, other) {
            return self.find(other) !== -1;
        }),
        __eq__: $m(function __eq__(self, other) {
            if (!_.isinstance(other, _.str))
                return false;
            return self._data === other._data;
        }),
        __format__: __not_implemented__('no formatting'),
        __ge__: $m(function __ge__(self, other) {
            return self.__cmd__(other) === -1;
        }),
        __getitem__: $m(function __getitem__(self, at) {
            if (!_.isinstance(at, _._int))
                _.raise(_.TypeError('need an int'));
            if (at < 0)
                at += self._data.length;
            if (at < 0 || at >= self._data.length)
                _.raise(_.IndexError('index out of range'));
            return self._data[at];
        }),
        __getslice__: $m(function __getslice__(self, i, j) {
            if (i<0) i = 0;
            if (j<0) j = 0;
            return _.str(self._data.slice(i,j));
        }),
    });

    _.list = Class('list', [], {
        __init__: $m({'ible':[]}, function __init__(self, ible) {
            if (ible instanceof Array) {
                self._list = ible.slice();
            } else if (_.isinstance(ible, [_.tuple, _.list])) {
                self._list = ible.as_js().slice();
            } else {
                var __ = _.iter(ible);
                self._list = [];
                while (__.trynext() && self._list.push(__.next())){}
            }
        }),
        as_js: $m(function as_js(self){
           return self._list;
        }),
        __add__: $m(function __add__(self, other) {
            if (!_.isinstance(other, _.list))
                throw _.TypeError('can only concatenate tuple to tuple');
            return _.tuple(self._list.concat(other._list));
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
            if (!_.isinstance(other, _.list))
                return false;
            if (self.__len__() !== other.__len__()) return false;
            var ln = self.__len__();
            for (var i=0;i<ln;i++) {
                if (!_.eq(self._list[i], other._list[i]))
                    return false;
            }
            return true;
        }),
        __ge__: __not_implemented__('ge'),
        __getitem__: $m(function __getitem__(self, index) {
            if (index < 0) index += self._list.length;
            if (index < 0 || index >= self._list.length)
                throw _.IndexError('index out of range');
            return self._list[index];
        }),
        __getslice__: $m(function __getslice__(self, a, b) {
            return _.list(self._list.slice(a,b));
        }),
        __gt__: __not_implemented__(''),
        __iadd__: $m(function __iadd__(self, other) {
            if (!_.isinstance(other, _.list))
                __builtins__.raise(_.TypeError('can only add list to list'));
            self._list = self._list.concat(other._list);
        }),
        __imul__: $m(function __imul__(self, other) {
            if (_.isinstance(other, _._int))
                other = other.as_js();
            if (type(other) != 'number')
                throw _.TypeError('only can multiply by a number');
            var res = []
            for (var i=0;i<other;i++) {
                res = res.concat(self.as_js());
            }
            self._list = res;
        }),
        __iter__: $m(function __iter__(self) {
            return _.listiterator(self);
        }),
        __le__: __not_implemented__(''),
        __len__: $m(function __len__(self) { return self._list.length; }),
        __lt__: __not_implemented__(''),
        __mul__: $m(function __mul__(self, other) {
            if (_.isinstance(other, _._int))
                other = other.as_js();
            if (type(other) == 'number') {
                var res = []
                for (var i=0;i<other;i++) {
                    res = res.concat(self.as_js());
                }
                return _.list(res);
            }
            throw _.TypeError('only can multiply by a number');
        }),
        __ne__: __not_implemented__(''),
        __repr__: $m(function __repr__(self) { return self.__str__(); }),
        __reversed__: $m(function __reversed__(self) {
            return _.listreversediterator(self);
        }),
        __rmul__: $m(function __rmul__(self, other) {
            return self.__mul__(other);
        }),
        __setitem__: $m(function __setitem__(self, i, val) {
            if (i < 0) i += self._list.length;
            if (i < 0 || i >= self._list.length)
                _.raise(_.IndexError('list index out of range'));
            self._list[i] = val;
        }),
        __setslice__: $m(function __setslice__(self, i, j, val) {
            var it = _.list(val)._list;
            self._list = self._list.slice(0, i).concat(it).concat(self._list.slice(j));
        }),
        append: $m(function append(self, what){
            self._list.push(what);
        }),
        count: $m(function count(self, value) {
            var c = 0;
            for (var i=0;i<self._list.length;i++) {
                if (_.eq(self._list[i], value))
                    c++;
            }
            return c;
        }),
        extend: $m(function extend(self, what) {
            self.__iadd__(_.list(what));
        }),
        index: $m(function index(self, value) {
            for (var i=0;i<self._list.length;i++) {
                if (_.eq(self._list[i], value))
                    return i;
            }
            _.raise(_.ValueError('x not in list'));
        }),
        insert: $m(function insert(self, i, val) {
            self._list = self._list.slice(0, i).concat([val]).concat(self._list.slice(i));
        }),
        pop: $m({'i':-1}, function pop(self, i) {
            if (i < 0) i += self._list.length;
            if (i < 0 || i >= self._list.length)
                __builtins__.raise(_.IndexError('pop index out of range'));
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
                a.push(_.repr(self._list[i]));
            }
            return _.str('['+a.join(', ')+']');
        }),
    });

    _.listiterator = Class('listiterator', [], {
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
                _.raise(_.StopIteration());
            var val = self.lst._list[self.at];
            self.at += 1;
            return val;
        }),
    });

    _.listreversediterator = Class('listreversediterator', [_.listiterator], {
        next: $m(function(self) {
            if (self.at > self.lst._list.length)
                _.raise(_.StopIteration());
            var val = self.lst._list[self.lst._list.length-1-self.at];
            self.at += 1;
            return val;
        }),
    });

    _.tupleiterator = Class('tupleiterator', [_.listiterator], {});

    _.iter = $m({'sentinel':null}, function iter(ible, sentinel) {
        if (sentinel)
            return callable_iterator(ible, sentinel);
        if (ible instanceof Array) 
            return _.tuple(ible).__iter__();
        if (!defined(ible.__iter__))
            _.raise('item not iterable');
        return ible.__iter__();
    });

    /** function progging **/

    _.all = __not_implemented__("all");
    _.vars = $m(function vars(obj) {
        // TODO::: this isn't good
        var dct = {};
        for (var a in obj) {
            dct[a] = obj[a];
        }
        return dct;
    });

    /** inheritence **/

    _.type = type;
    _.classmethod = classmethod;
    _.staticmethod = staticmethod;

    _.isinstance = $m(function isinstance(inst, clsses) {
        if (!defined(inst.__class__))
            _.raise("PJs Error: isisntance only works on objects");
        return _.issubclass(inst.__class__, clsses);
    });

    _.issubclass = $m(function issubclass(cls, clsses) {
        if (!defined(cls.__bases__))
            _.raise("PJs Error: issubclass only works on classes");
        if (!(clsses instanceof Array))
            clsses = [clsses];
        for (var i=0;i<clsses.length;i++) {
            if (cls === clsses[i]) return true;
            for (var a=0;a<cls.__bases__.length;a++) {
                if (_.issubclass(cls.__bases__[a], clsses))
                    return true;
            }
        }
        return false;
    });

    _.help = __not_implemented__("help");

    _.copyright = 'something should go here...';

    _.input = __not_implemented__("input");
    _.oct = __not_implemented__("oct");
    _.bin = __not_implemented__("bin");
    _.SystemExit = __not_implemented__("SystemExit");
    _.format = __not_implemented__("format");
    _.sorted = __not_implemented__("sorted");
    _.False = __not_implemented__("False");
    _.__package__ = __not_implemented__("__package__");
    _.round = __not_implemented__("round");
    _.dir = __not_implemented__("dir");
    _.cmp = __not_implemented__("cmp");
    _.set = __not_implemented__("set");
    _.bytes = __not_implemented__("bytes");
    _.reduce = __not_implemented__("reduce");
    _.intern = __not_implemented__("intern");
    _.Ellipsis = __not_implemented__("Ellipsis");
    _.locals = __not_implemented__("locals");
    _.slice = __not_implemented__("slice");
    _.sum = __not_implemented__("sum");
    _.getattr = __not_implemented__("getattr");
    _.abs = __not_implemented__("abs");
    _.exit = __not_implemented__("exit");
    _.print = $m({}, true, function _print(args) {
        var strs = [];
        for (var i=0;i<args._list.length;i++) {
            strs.push(_.str(args._list[i]));
        }
        print(strs.join(' '));
    });
    _.print.__name__ = 'print';
    _.assert = $m(function assert(bool, text) {
        if (!bool) {
            throw Error(text);
        }
    });
    _._debug_stack = [];
    _.raise = $m(function raise(obj) {
        obj.stack = _._debug_stack.slice();
        throw obj;
    });
    _.True = true;
    _.None = null;
    _.len = $m(function len(obj) {
        if (obj instanceof Array) return obj.length;
        if (obj instanceof String) return obj.length;
        if (obj.__len__) return obj.__len__();
        _.raise(_.TypeError('no function __len__'));
    });
    _.credits = __not_implemented__("credits");
    _.ord = __not_implemented__("ord");
    // _.super = __not_implemented__("super");
    _.license = __not_implemented__("license");
    _.KeyboardInterrupt = __not_implemented__("KeyboardInterrupt");
    _.filter = __not_implemented__("filter");
    _.range = __not_implemented__("range");
    _.BaseException = __not_implemented__("BaseException");
    _.pow = __not_implemented__("pow");
    _.globals = __not_implemented__("globals");
    _.divmod = __not_implemented__("divmod");
    _.enumerate = __not_implemented__("enumerate");
    _.apply = __not_implemented__("apply");
    _.open = __not_implemented__("open");
    _.quit = __not_implemented__("quit");
    _.zip = __not_implemented__("zip");
    _.hex = __not_implemented__("hex");
    _.next = __not_implemented__("next");
    _.chr = __not_implemented__("chr");
    _.xrange = __not_implemented__("xrange");


    _.reversed = __not_implemented__("reversed");
    _.hasattr = __not_implemented__("hasattr");
    _.delattr = __not_implemented__("delattr");
    _.setattr = __not_implemented__("setattr");
    _.raw_input = __not_implemented__("raw_input");
    _.compile = __not_implemented__("compile");

    _.repr = $m(function repr(item) {
        if (typeof(item) === 'string') {
            return "'" + item + "'";
        } else if (typeof(item) === 'number') {
            return '' + item;
        } else if (defined(item.__repr__)) {
            return item.__repr__();
        } else return _.str(item);
    });

    _.property = __not_implemented__("property");
    _.GeneratorExit = __not_implemented__("GeneratorExit");
    _.coerce = __not_implemented__("coerce");
    _.file = __not_implemented__("file");
    _.unichr = __not_implemented__("unichr");
    _.id = __not_implemented__("id");
    _.min = __not_implemented__("min");
    _.execfile = __not_implemented__("execfile");
    _.any = __not_implemented__("any");
    _.NotImplemented = __not_implemented__("NotImplemented");
    _.map = __not_implemented__("map");
    _.buffer = __not_implemented__("buffer");
    _.max = __not_implemented__("max");
    _.callable = __not_implemented__("callable");
    _.eval = __not_implemented__("eval");
    _.__debug__ = __not_implemented__("__debug__");

    _.Exception = Class('Exception', [], {
        __init__: $m({}, true, function __init__(self, args) {
            self.args = args;
        }),
        __str__: $m(function __str__(self) {
            if (_.len(self.args) == 1)
                return self.__class__.__name__+': '+_.str(self.args.__getitem__(0));
            return self.__class__.__name__+': '+_.str(self.args);
        }),
    });

    _.TypeError = Class('TypeError', [_.Exception], {});
    _.NameError = Class('NameError', [_.Exception], {});
    _.ValueError = Class('ValueError', [_.Exception], {});
    _.IndexError = Class('IndexError', [_.Exception], {});
    _.NotImplemented = Class('NotImplemented', [_.Exception], {});
});

__module_cache['<builtin>/sys.py'].load('sys'); // must be loaded for importing to work.
__module_cache['<builtin>/os/path.py'].load('os.path');
var __builtins__ = __module_cache['<builtin>/__builtin__.py'].load('__builtin__');
var __import__ = __builtins__.__import__; // should I make this global?

