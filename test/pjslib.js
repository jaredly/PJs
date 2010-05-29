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

/** python function madness =) **/

/**
 * How to use:

    $m([defaults], [aflag], [kflag], fn);

    defaults, aflag, and kflag are all optional, but required to be in that
        order to avoid ambiguity.

    defaults = an associative array of key, value pairs; the key is the arg
        name, anf the vaule is default value.

    aflag signals that the last (or second-to-last, if kflag is true) is to be
        populated with excess positional arguments. (in python, this is the *args
        syntax).

    kflag is like aflag, but for positional arguments, e.g. **kwargs.

    there's also checks happening the whole way, so you won't be stuck debugging
    another annoying undefined error.

    Here's an example that uses all of these:

    var foo = $m({c:null, d:10}, true, true, function foo(a, b, c, d, args, kwargs) {
        // only a and b are required, and excess positional and dictionary
        // arguments will be captured.
        console.log([a, b, c, d, args, kwargs]);
    });
    
    and in use...

    > foo(1);
    TypeError: foo requires 2 arguments (1 given)
    > foo(1,2);
    [1, 2, null, 10, [], {}]
    > foo(1,2,3);
    [1, 2, 3, 10, [], {}]
    > foo(1,2,3,4,5,6,7,8,9);
    [1, 2, 3, 4, [5, 6, 7, 8, 9], {}]

    now some some real magic; dictionary arguments:

    > foo.args([1], {'b':9, 'd':20, 'man':'hatten'}
    [1, 9, null, 20, [], {'man': 'hatten'}]

    !! that looks like python !! well...almost. but it's lovely :)
**/

var to_array = function(a){return Array.prototype.slice.call(a,0);};
var fnrx = /function(?:\s+\w*)?\s*\(([\w,\s]*)\)/;

function defined(x){
    return typeof(x) != 'undefined';
}
/*
String.prototype.strip = function(){
    return this.replace(/^\s+/,'').replace(/\s+$/,'');
};
*/
function get_fn_args(func) {
    /* get the arguments of a function */
    var match = (func + '').match(fnrx);
    if (!match)
        throw "ParseError: sorry, something went wrong on my end; are you sure you're passing me a valid function?" + (func+'');
    var args = match[1].split(',');
    for (var i=0;i<args.length;i++) {
        args[i] = args[i].replace(/^\s+/,'').replace(/\s+$/,'');
    }
    if (args.length == 1 && !args[0])
        return [];
    if (args.length !== func.length)
        throw "ParseError: didn't parse the right number of arguments: "+args.length+' vs '+func.length;
    return args;
}
    
function check_defaults(func_args, defaults, argnum) {
    var dflag = false;
    for (var i=0;i<argnum;i++) {
        if (defined(defaults[func_args[i]]))
            dflag = true;
        else if (dflag)
            return false;
    }
    return true;
}

function $m() {
    var args = Array.prototype.slice.call(arguments);
    if (!args.length)
        throw new Error("JS Error: $m requires at least one argument.");
    var func = args.pop();
    var name = func.__name__ || func.name;
    if (typeof(func) !== 'function')
        throw new Error("JS Error: $m requires a function as the last argument");
    var func_args = get_fn_args(func);
    var defaults = args.length?args.shift():{};
    if (!(defaults instanceof Object))
        throw new Error("the defaults argument must be an object");
    var aflag = args.length?args.shift():false;
    var kflag = args.length?args.shift():false;
    if (args.length) throw new Error("JS Error: $m takes at most 4 arguments. (" + (4+args.length) + " given)");

    var argnum = func_args.length;
    if (aflag) argnum--;
    if (kflag) argnum--;
    if (argnum < 0)
        throw new Error('SyntaxError: not enough arguments specified');

    if (!check_defaults(func_args, defaults, argnum))
        throw new Error("SyntaxError in function " + name + ": non-default argument follows default argument");

    var ndefaults = 0;
    var first_default = -1;
    for (var x in defaults){
        ndefaults++;
        var at = func_args.slice(0,argnum).indexOf(x);
        if (at === -1) {
            throw new Error('ArgumentError: unknown default key ' + x + ' for function ' + name);
        }
        else if (first_default === -1 || at < first_default)
            first_default = at;
    }
    if (first_default !== -1)
        for (var i=first_default;i<argnum;i++)
            if (!defined(defaults[func_args[i]]))
                throw new Error('SyntaxError: non-default argument follows default argument');

    var meta = function() {
        var name = func.__name__ || func.name;
        var args = to_array(arguments);
        if (!meta._accept_undefined) {
            for (var i=0;i<args.length;i++) {
                if (!defined(args[i])) {
                    var an = func_args[i] || aflag && func_args.slice(-1)[0];
                    throw new Error("TypeError: you passed in something that was undefined to " + __builtins__.str(meta) + '() for argument ' + an);
                }
            }
        }
        if (args.length > argnum) {
            if (!aflag)
                throw new Error("TypeError: " + name + "() takes at most " + (argnum) + " arguments (" + args.length + " given)");
            var therest = __builtins__.tuple(args.slice(argnum));
            args = args.slice(0, argnum);
            args.push(therest);
        } else {
            for (var i=args.length; i<argnum; i++) {
                if (!defined(defaults[func_args[i]])) {
                    throw __builtins__.TypeError(name + "() takes at least " + (argnum-ndefaults) +" arguments (" + args.length + " given)");
                }
                args.push(defaults[func_args[i]]);
            }
            if (aflag)
                args.push(__builtins__.tuple());
        }
        if (kflag)
            args.push(__builtins__.dict());
        if (__builtins__)
            __builtins__._debug_stack.push([name, meta, args]);
        var result = func.apply(null, args);
        if (__builtins__)
            __builtins__._debug_stack.pop();
        if (result === undefined) result = null;
        return result;
    };

    meta.args = function(args, dict) {
        if (!defined(dict))
            throw new Error('TypeError: $m(fn).args must be called with both arguments.');
        if (args.__class__) {
            if (!__builtins__.isinstance(args, [__builtins__.tuple, __builtins__.list])) {
                throw new Error('can only pass a list or tuple to .args()');
            } else {
                args = args.as_js();
            }
        }
        if (dict.__class__) {
            if (!__builtins__.isinstance(dict, [__builtins__.dict])) {
                __builtins__.raise(__builtins__.TypeError('can only pass a dict to .args()'));
            } else {
                dict = dict.as_js();
            }
        }
        // convert args, dict to types
        if (args.length > argnum) {
            if (!aflag)
                throw new Error("TypeError: " + name + "() takes at most " + argnum + ' arnuments (' + args.length + ' given)');
            therest = __builtins__.tuple(args.slice(argnum));
            args = args.slice(0, argnum);
            args.push(therest);
        } else {
            for (var i=args.length;i<argnum;i++) {
                var aname = func_args[i];
                if (defined(dict[aname])) {
                    args.push(dict[aname]);
                    delete dict[aname];
                } else if (defined(defaults[aname]))
                    args.push(defaults[aname]);
                else
                    throw new Error('TypeError: ' + name + '() takes at least ' + argnum-ndefaults + ' non-keyword arguments');
            }
            if (aflag)
                args.push(__builtins__.tuple());
        }
        if (kflag)
            args.push(__builtins__.dict(dict));
        else
            for (var kname in dict)
                throw new Error("TypeError: " + name + '() got unexpected keyword argument: ' + kname);
        if (__builtins__)
            __builtins__._debug_stack.push([name, func, [args, dict]]);
        var result = func.apply(null, args);
        if (__builtins__)
            __builtins__._debug_stack.pop();
        if (result === undefined) result = null;
        return result;
    };
    meta.__wraps__ = func;
    meta.__type__ = func.__type__?func.__type__:'function';
    meta.__name__ = func.__name__?func.__name__:func.name;
    func.__wrapper__ = meta;
    meta.args.__wraps__ = func;
    meta.args.__type__ = meta.__type__;
    meta.args.__name__ = meta.__name__;
    return meta;
}

// vim: sw=4 sts=4
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

/** python-style classes in javascript!! **/

var to_array = function to_array(a){return Array.prototype.slice.call(a,0);};

function instancemethod(cls, fn) {
    var meta = function $_instancemethod() {
        /*
        if (!__builtins__.isinstance(arguments[0], cls))
            throw new Error('TypeError: unbound method '+fn.__name__+'() must be called with '+cls.__name__+' instance as the first argument');
        */
        return fn.apply(null, arguments);
    }
    meta.__name__ = fn.__name__?fn.__name__:fn.name;
    meta.__type__ = instancemethod;
    meta.__wraps__ = fn;
    fn.__wrapper__ = meta;
    meta.__str__ = function str(){
        return '<unbound method '+cls.__name__+'.'+meta.__name__+'>';
    };
    meta.im_class = cls;
    meta.im_func = fn;
    meta.im_self = null;
    meta.__get__ = function $_get(self, cls) {
        cls = cls||self.__class__;
        /*
        if (!__builtins__.isinstance(self, cls))
            throw new Error('idk what just happened... invalid self while binding instancemethod');
        */
        var m2 = function() {
            return fn.apply(this, [self].concat(to_array(arguments)));
        };
        m2.__name__ = meta.__name__;
        m2.__class__ = cls;
        m2.__type__ = instancemethod;
        m2.__wraps__ = fn;
        fn.__wraper__ = fn;
        m2.__str__ = function(){
            return '<bound method '+cls.__name__+'.'+meta.__name__+' of '+self.__str__()+'>';
        };
        m2.im_class = cls;
        m2.im_func = fn;
        m2.im_self = self;
        m2.args = function $_args(pos, kwd) {
            if (pos.__class__)
               pos = __builtins__.tuple([self]).__add__(pos);
            else
               pos = [self].concat(pos);
            return fn.args(pos, kwd);
        };
        m2.args.__name__ = meta.__name__;
        return m2;
    };
    return meta;
}

function _set_name(fn, name) {
    fn.__name__ = name;
    while(fn = fn.__wraps__)
        fn.__name__ = name;
}

var type = $m(function type(name, bases, namespace) {
    var cls = function $_type() {
        var self = {};
        self.__init__ = instancemethod(cls, function(){}).__get__(self);
        self.__class__ = cls;
        self.__type__ = 'instance';

        for (var attr in cls) {
            if (['__type__','__class__'].indexOf(attr)!==-1)
              continue;
            var val = cls[attr];
            if (val && val.__type__ == instancemethod && !val.im_self) {
                self[attr] = val.__get__(self, cls);
                _set_name(self[attr], attr);
            } else
                self[attr] = val;
        }
        self.__init__.apply(null, arguments);
        self._old_toString = self.toString;
        if (self.__str__)
            self.toString = function(){ return self.__str__()._data; };
        return self;
    };
    var ts = cls.toString;
    var __setattr__ = $m(function class_setattr(key, val) {
        if (val && val.__type__ === 'function' ||
                (val && !val.__type__ && typeof(val)==='function')) {
            cls[key] = instancemethod(cls, val);
        } else if (val && val.__type__ === classmethod) {
            cls[key] = val.__get__(cls);
        } else if (val && val.__type__ === staticmethod) {
            cls[key] = val.__get__(cls);
        } else if (val && val.__type__ === instancemethod) {
            cls[key] = instancemethod(cls, val.im_func);
        } else
            cls[key] = val;
    });
    for (var i=0;i<bases.length;i++) {
        for (var key in bases[i]) {
            if (key === 'prototype') continue;
            var val = bases[i][key];
            __setattr__(key, val);
        }
    }
    cls.__type__ = 'type';
    cls.__bases__ = bases;
    cls.__name__ = name;
    for (var key in namespace) {
        __setattr__(key, namespace[key]);
    }
    //if (cls.toString === ts)
    //  cls.toString = cls.__str__;
    return cls;
});

function classmethod(val) {
    var clsm = {};
    clsm.__get__ = function(cls) {
        return instancemethod(cls, val).__get__(cls);
    };
    clsm.__type__ = classmethod;
    clsm.__str__ = function(){return '<classmethod object at 0x10beef01>';};
    return clsm;
}
/*
function __classmethod(cls, val){
    var fn = function() {
        return val.apply(this, [cls].concat(to_array(arguments)));
    };
    if (val.args) {
        fn.args = function(pos, kwd) {
            return val.args([cls].concat(pos), kwd);
        };
    }
    fn.__type__ = 'classmethod';
    fn.__wraps__ = val;
    return fn;
}

// decorators
function classmethod(method){
    method.__cls_classmethod = true;
    return method;
}
*/
function staticmethod(method){
    var obj = {};
    obj.__type__ = staticmethod;
    obj.__get__ = function(){return method;}
    obj.__str__ = function(){return '<staticmethod object at 0x10beef01>';};
    return obj;
}

var Class = type;

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

/** general module loading... not spectacular, I know; it gets better when you
 * add sys and __builtins__
 **/

var __module_cache = {};
function module(filename, fn) {
    var that = {};
    that.__file__ = filename;
    that.__init__ = fn;
    that.load = $m({'mod':null}, function load_module(name, mod) {
        if (mod === null) mod = {};
        mod.__name__ = name;
        if (__builtins__) mod.__name__ = __builtins__.str(name);
        mod.__file__ = that.__file__;
        if (__builtins__) mod.__file__ = __builtins__.str(that.__file__);
        mod.__dict__ = mod;
        that._module = mod;
        fn(mod);
        return mod;
    });
    __module_cache[that.__file__] = that;
}

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

// dumb IE fix
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}

/** onboard console for dumb broswers (cough IE cough) who don't provide a console **/
try {
if (window.console === undefined || window.console.log === undefined) {
    $(function (){
        var consolediv = $('<div class="console-log"><div class="count"></div></div>').appendTo($('body')).css({
            'background-color': 'black',
            'opacity': 0.7,
            'bottom': 0,
            'left': 0,
            'padding': '5px 0px',
            'width':'100%',
            'position': 'absolute',
            'height': '30px',
            'overflow':'scroll',
            'color':'white'
        });
        consolediv.click(function () {
            if (consolediv.height() === 200)
                consolediv.css('height', '30px');
            else
                consolediv.css('height', '200px');
            });
        $('.count', consolediv).css({
            'position': 'absolute',
            'top': '5px',
            'right': '5px',
            'color': 'white',
            'font-weight': 'bold'
        });
        var count = 0;
        window.console = {log: function () {
            var args = Array.prototype.slice.call(arguments);
            $('<div class="log-item">' + args.join(' ') + '</div>').appendTo(consolediv).css({
                'padding-left': '5px'
            });
            count++;
            $('.count', consolediv).html(count);
        }};
    });
}
} catch (e) {}

/**
Now you can import stuff...just like in python.
**/

var __not_implemented__ = function __not_implemented__(name) {
    return function not_implemented() {
        if (arguments.callee.__name__)
            name = arguments.callee.__name__;
        $b.raise($b.NotImplementedError("the builtin function "+name+" is not implemented yet. You should help out and add it =)"));
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
        first = $b.js(first);
        args = $b.js(args);
        var path = first;
        for (var i=0;i<args.length;i++) {
            args[i] = $b.js(args[i]);
            if (_.isabs(args[i])) {
                path = args[i];
            } else if (path === '' || '/\\:'.indexOf(path.slice(-1)) !== -1) {
                path += args[i];
            } else
                path += '/' + args[i];
        }
        return $b.str(path);
    });
    _.isabs = $m(function isabs(path) {
        path = $b.js(path);
        if (!path)return false;
        return path && path[0] == '/';
    });
    _.abspath = $m(function abspath(path) {
        path = $b.js(path);
        if (!_.isabs(path))
            _.raise("not implementing this atm");
        return _.normpath(path);
    });
    _.dirname = $m(function dirname(path) {
        path = $b.js(path);
        return $b.str(path.split('/').slice(0,-1).join('/') || '/');
    });
    _.basename = $m(function basename(path) {
        path = $b.js(path);
        return $b.str(path.split('/').slice(-1)[0]);
    });
    _.normpath = $m(function normpath(path) {
        path = $b.js(path);
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
        return $b.str(prefix + comps.join('/'));
    });
});

module('<builtin>/__builtin__.py', function builting_module(_) {

    var sys = __module_cache['<builtin>/sys.py']._module;

    _.__doc__ = 'Javascript corrospondences to python builtin functions';

    _.py = $m(function py(what) {
        if (what === null || what.__class__) return what;
        if (what instanceof Array) {
            return _.list(what);
        } else if (typeof(what) === 'string') {
            return _.str(what);
        } else if (typeof(what) === 'number') {
            if (what === Math.round(what)) {
                return what; // int
            } else {
                return _._float(what);
            }
        } else {
            return _.dict(what);
        }
    });

    _.js = $m(function js(what) {
        if (what === null) return what;
        if (_.isinstance(what, [_.list, _.tuple])) {
          var l = what.as_js();
          var res = [];
          for (var i=0;i<l.length;i++) {
            res.push(_.js(l[i]));
          }
          return res;
        } else if (_.isinstance(what, _.dict)) {
          var obj = {};
          var k = what.keys().as_js();
          var v = what.values().as_js();
          for (var i=0;i<k.length;i++) {
            obj[_.js(k[i])] = _.js(v[i]);
          }
          return obj;
        }
        if (typeof(what) === 'object') {
          if (defined(what.as_js))
              return what.as_js();
          else if (what.__class__ || what.__type__)
              _.raise(_.TypeError('cannot coerce to javascript'));
        } else if (typeof(what) === 'function') {
          var wrapper = function $_function_wrapper() {
            try {
              what.apply(this, arguments);
            } catch (e) {
              var stack = __builtins__._debug_stack;
              _.output_exception(e, stack);
              throw e;
            }
          };
          wrapper.__name__ = what.__name__ || what.name;
          wrapper.__class__ = what.__class__;
          wrapper.__wraps__ = what;
          what.__wrapped__ = wrapper;
          return wrapper;
        }
        return what;
    });
    _.js.__module__ = _.__name__;
    _.js.__file__ = _.__file__;
    /** importing modules **/
    _.__import__ = $m({'file':'','from':''},
      function __import__(name, from, file) {
        from = $b.js(from);
        file = $b.js(file);
        if (defined(sys.modules[name]))
            return sys.modules[name];
        var path = __module_cache['<builtin>/os/path.py']._module;
        var relflag = false;
        var foundat = null;
        var syspath = $b.js(sys.path);
        for (var i=0;i<syspath.length;i++) {
            relflag = syspath[i][0] !== '/' && syspath[i].indexOf('<builtin>') !== 0;
            if (relflag)
                var dname = $b.js(path.normpath(path.join(path.dirname(file), syspath[i])));
            else
                var dname = $b.js(syspath[i]);
            var fname = $b.js(path.join(dname, $b.js(name).replace('.', '/')+'.py'));
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

    /** operators **/
    _.do_op = $m(function do_op(op, rop, a, b) {
        var val;
        if (a[op]) {
            val = a[op](b);
            if (val !== _.NotImplemented)
                return val;
        }
        if (b[rop]) {
            return b[rop](a);
        }
        return _.NotImplemented;

    });
    _.do_ops = $m({}, true, function do_ops(allthem) {
        var ops = {'<':_.lt,'>':_.gt,'<=':_.lte,'>=':_.gte,'==':_.eq,'!=':_.ne};
        if (_.len(allthem) % 2 === 0)
            _.raise(_.ValueError('do_ops requires an odd number of arguments'));
        allthem = _.js(allthem);
        for (var i=0;i<allthem.length-2;i+=2) {
            if (allthem[i+1] === '===') {
                if (allthem[i] !== allthem[i+2])
                    return false;
            } else if (allthem[i+1] === '!==') {
                if (allthem[i] === allthem[i+2])
                    return false;
            } else {
                if (undefined === ops[allthem[i+1]])
                    _.raise(_.ValueError('invalid op'));
                if (!ops[allthem[i+1]](allthem[i], allthem[i+2]))
                    return false;
            }
        }
        return true;
    });
    _.add = $m(function add(a, b) {
        var val = _.do_op('__add__', '__radd__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a + b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.add.__module__ = _.__name__;
    _.sub = $m(function sub(a, b) {
        var val = _.do_op('__sub__', '__rsub__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a - b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.gt = $m(function gt(a, b) {
        var val = _.do_op('__gt__', '__lt__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a > b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.lt = $m(function lt(a, b) {
        return !_.gte(a, b);
    });
    _.gte = $m(function ge(a, b) {
        var val = _.do_op('__ge__', '__le__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a >= b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.lte = $m(function le(a, b) {
        return !_.gt(a, b);
    });
    _.mod = $m(function mod(a, b) {
        var val = _.do_op('__mod__', '__rmod__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a % b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.mult = $m(function mul(a, b) {
        var val = _.do_op('__mul__', '__rmul__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a * b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for *'));
        } else
            return val;
    });
    _.ne = $m(function ne(a, b) {
        var val = _.do_op('__ne__', '__ne__', a, b);
        if (val === _.NotImplemented) {
              return a !== b;
        } else
            return val;
    });
    _.eq = $m(function eq(a, b) {
        var val = _.do_op('__eq__', '__eq__', a, b);
        if (val === _.NotImplemented) {
              return a === b;
        } else
            return val;
    });
    _.div = $m(function div(a, b) {
        var val = _.do_op('__div__', '__rdiv__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return Math.floor(a / b);
            else
                _.raise(_.TypeError('unsupported operand type(s) for /'));
        } else
            return val;
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
                        if (itable[i].length !== 2) {
                            _.raise(_.ValueError('invalid list passed to dict'));
                        }
                        self.__setitem__(itable[i][0], itable[i][1]);
                    }
                } else if (!(itable instanceof Object))
                    _.raise(_.ValueError('arg cannot be coerced to a dict'));
                else {
                    for (var k in itable) {
                        self.__setitem__(_.py(k), _.py(itable[k]));
                    }
                }
            } else if (_.isinstance(itable, _.dict)) {
                var keys = itable.keys().as_js();
                for (var i=0;i<keys.length;i++){
                    self.__setitem__(keys[i], itable.__getitem__(keys[i]));
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
            var dct = {};
            for (var i=0;i<self._keys.length;i++){
                dct[self._keys[i]] = self._values[i];
            }
            return dct;
        }),
        __cmp__: $m(function __cmp__(self, other){
            _.raise(_.AttributeError('not yet implemented'));
        }),
        __contains__: $m(function __contains__(self, key){
            return self.keys().__contains__(key);
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
        __getitem__: $m(function __getitem__(self, key) {
            if (!self.keys().__contains__(key)) {
                _.raise(_.KeyError(_.repr(key).as_js() + ' not in dictionary ' + _.repr(self._keys).as_js()));
            }
            var at = self.keys().index(key);
            return self._values[at];
        }),
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
            if (self.keys().__contains__(key)) {
                var i = self.keys().index(key);
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
                _.raise(_.KeyError('popitem(): dictionary is empty'));
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
            return _.list(self._values.slice());
        })
    });

    _.unicode = __not_implemented__("unicode");
    _.bytearray = __not_implemented__("bytearray");
    _.object = __not_implemented__("object");
    _.complex = __not_implemented__("complex");

    _.bool = $m(function bool(what) {
        if (defined(what.__bool__))
            return what.__bool__();
        else if (defined(what.__len__))
            return _.len(what) !== 0;
        if (what)
            return true;
        return false;
    });

    _._int = $m(function _int(what) {
        if (typeof(what) === 'string')
            return parseInt(what);
        else if (typeof(what) === 'number') return what;
        else
            _.raise(_.TypeError('can\'t coerce to int'));
    });
    _._float = Class('float', [], {
        __init__: $m({'what':0.0}, function __init__(self, what) {
            self._data = what;
        }),
        as_js: $m(function(self){
            return self._data;
        }),
        __str__: $m(function (self) {
            return _.str('' + self._data);
        }),
        __div__: $m(function __div__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(self._data/_.js(other));
            }
            return _.NotImplemented;
        }),
        __rdiv__: $m(function __rdiv__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other)/self._data);
            }
            return _.NotImplemented;
        }),
        __add__: $m(function __add__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other) + self._data);
            }
            return _.NotImplemented;
        }),
        __radd__: $m(function __radd__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other) + self._data);
            }
            return _.NotImplemented;
        }),
        __mul__: $m(function __mul__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other) * self._data);
            }
            return _.NotImplemented;
        }),
        __rmul__: $m(function __rmul__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other) * self._data);
            }
            return _.NotImplemented;
        }),
        __sub__: $m(function __sub__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(self._data - _.js(other));
            }
            return _.NotImplemented;
        }),
        __rsub__: $m(function __rsub__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other) - self._data);
            }
            return _.NotImplemented;
        })
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
                var __ = _.foriter(ible);
                self._list = [];
                self._len = 0;
                while (__.trynext()){
                    self._list.push(__.value);
                    self._len++
                }
            }
        }),
        as_js: $m(function as_js(self){
           return self._list;
        }),
        __add__: $m(function __add__(self, other) {
            if (!_.isinstance(other, _.tuple))
                _.raise(_.TypeError('can only concatenate tuple to tuple'));
            return _.tuple(self._list.concat(other._list));
        }),
        __contains__: $m(function __contains__(self, one){
            var at = -1;
            for (var i = 0; i < self._list.length; i++) {
                if (_.eq(one, self._list[i])) {
                    at = i;
                    break;
                }
            }
            return at !== -1;
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
            if (_.isinstance(index, _.slice)) {
                var nw = [];
                var sss = index.indices(self._list.length).as_js();
                for (var i=sss[0];i<sss[1];i+=sss[2])
                    nw.push(self._list[i]);
                return _.tuple(nw);
            } else if (typeof(index) === 'number') {
                if (index < 0) index += self._list.length;
                if (index < 0 || index >= self._list.length)
                    _.raise(_.IndexError('index out of range'));
                return self._list[index];
            } else
                _.raise(_.ValueError('index must be a number or slice'));
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
            if (typeof(other) == 'number') {
                var res = []
                for (var i=0;i<other;i++) {
                    res = res.concat(self.as_js());
                }
                return _.tuple(res);
            }
            _.raise(_.TypeError('only can multiply by a number'));
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
        })
    });

    _.frozenset = __not_implemented__("frozenset");
    _.hash = __not_implemented__("hash");
    _._long = __not_implemented__("long");
    _.basestring = __not_implemented__("basestring");
    _.floordiv = $m(function floordiv(a, b) {
        return Math.floor(a/b);
    });

    _.str = Class('str', [], {
        __init__: $m({'item':''}, function __init__(self, item) {
            if (item === null)
                self._data = 'None';
              else if (typeof(item) === 'string')
                self._data = item;
            else if (typeof(item) === 'number')
                self._data = ''+item;
            else if (typeof(item) === 'boolean')
                self._data = _.str(''+item).title()._data;
            else if (defined(item.__str__) && item.__str__.im_self)
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
                        self._data = '<javascript function "' + item.name + '">';
                    else if (!item.__module__)
                        self._data = '<anonymous function...>';
                    else
                        self._data = '<anonymous function in module "' + item.__module__ + '">';
                } else {
                    var name = item.__name__;
                    while (item.__wrapper__)
                      item = item.__wrapper__;
                    if (item.im_class)
                        name = item.im_class.__name__ + '.' + name;
                    if (item.__class__)
                        name = item.__class__.__name__ + '.' + name;
                    if (!item.__module__)
                        
                        self._data = '<function '+ name +'>';
                    else
                        self._data = '<function '+ name +' from module '+item.__module__+'>';
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
        __str__: $m(function __str__(self) {
            return self;
        }),
        __len__: $m(function __len__(self) {
            return self._data.length;
        }),
        __repr__: $m(function __repr__(self) {
            // TODO: implement string_escape
            return _.str("'" + self._data.replace('\n','\\n') + "'");
        }),
        __add__: $m(function __add__(self, other) {
            if (_.isinstance(other, _.str))
                return _.str(self._data + other._data);
            if (typeof(other) === 'string')
                return _.str(self._data + other);
            return _.NotImplemented;
        }),
        __contains__: $m(function __contains__(self, other) {
            return self.find(other) !== -1;
        }),
        __eq__: $m(function __eq__(self, other) {
            if (typeof(other) === 'string')
                other = _.str(other);
            if (!_.isinstance(other, _.str))
                return false;
            return self._data === other._data;
        }),
        __ne__: $m(function __ne__(self, other) {
            return !self.__eq__(other);
        }),
        __format__: __not_implemented__('no formatting'),
        __ge__: $m(function __ge__(self, other) {
            return self.__cmd__(other) === -1;
        }),
        __getitem__: $m(function __getitem__(self, at) {
            if (_.isinstance(at, _.slice)) {
                var sss = at.indices(self._data.length).as_js();
                if (sss[2] === 1)
                    return _.str(self._data.slice(sss[0],sss[1]));
                var res = '';
                for (var i=sss[0];i<sss[1];i+=sss[2])
                    res += self._data[i];
                return _.str(res);
            } else if (!_.isinstance(at, _._int))
                _.raise(_.TypeError('need an int in getitem...' + _.str(at)));
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
        toString: $m(function toString(self) {
            return self._data;
        }),
        as_js: $m(function as_js(self) {
            return self._data;
        }),
        capitalize: $m(function capitalize(self) {
            var s = self._data[0].toUpperCase();
            return _.str(s + self._data.slice(1).toLowerCase());
        }),
        center: __not_implemented__('str.center'),
        count: __not_implemented__('str.count'),
        decode: __not_implemented__('str.decode'),
        encode: __not_implemented__('str.encode'),
        endswith: $m(function(self, what) {
            if (!_.isinstance(what, [_.tuple, _.list]))
                what = [what]
            else
                what = what.as_js();
            for (var i=0;i<what.length;i++) {
                if (self._data.slice(-what[i].length).indexOf(what[i]) === 0)
                    return true;
            }
            return false;
        }),
        expandtabs: __not_implemented__('str.expandtabs'),
        find: $m({'start':null, 'end':null}, function find(self, sub, start, end) {
            if (start === null) start = 0;
            if (end === null) end = self._data.length;
            var at = self._data.slice(start,end).indexOf(sub);
            if (at !== -1)at += start;
            return at;
        }),
        format: __not_implemented__('str.format'),
        index: $m({'start':null, 'end':null}, function index(self, sub, start, end) {
            var res = self.find(sub, start, end);
            if (res === -1)
                _.raise(_.ValueError('substring not found'));
            return res;
        }),
        isalnum: __not_implemented__('str.isalnum'),
        isalpha: __not_implemented__('str.isalpha'),
        isdigit: __not_implemented__('str.isdigit'),
        islower: __not_implemented__('str.islower'),
        isspace: __not_implemented__('str.isspace'),
        istitle: __not_implemented__('str.istitle'),
        isupper: __not_implemented__('str.isupper'),
        join: $m(function(self, ible) {
            var __ = _.foriter(ible);
            var res = [];
            var v;
            while (__.trynext()) {
                v = __.value;
                if (typeof(v) === 'string')
                    v = _.str(v);
                if (!_.isinstance(v, _.str))
                    _.raise(_.TypeError('joining: string expected'));
                res.push(v._data);
            }
            return _.str(res.join(self._data));
        }),
        ljust: __not_implemented__('str.ljust'),
        lower: $m(function(self) {
            return _.str(self._data.toLowerCase());
        }),
        lstrip: __not_implemented__('str.lstrip'),
        partition: __not_implemented__('str.partition'),
        replace: __not_implemented__('str.replace'),
        rfind: __not_implemented__('str.rfind'),
        rindex: __not_implemented__('str.rindex'),
        split: $m({'count':-1}, function split(self, sub, count) {
            var res = _.list();
            if (typeof(sub) === 'string') sub = _.str(sub);
            if (!_.isinstance(sub, _.str))
                _.raise(_.TypeError('sub must be a string'));
            if (!sub._data.length)
                _.raise(_.ValueError('empty separator'));
            if (typeof(count) !== 'number')
                _.raise(_.TypeError('a number is required'));
            var rest = self._data;
            while(count < 0 || count > 0) {
                var at = rest.indexOf(sub._data);
                if (at == -1)
                    break;
                count -= 1;
                res.append(_.str(rest.slice(0, at)));
                rest = rest.slice(at + sub._data.length);
            }
            res.append(_.str(rest));
            return res;
        }),
        splitlines: $m({'keepends':false}, function(self, keepends) {
            var res = self._data.split(/\n/g);
            var l = _.list();
            for (var i=0;i<res.length-1;i++) {
                var k = res[i];
                if (keepends) k += '\n';
                l.append(_.str(k));
            }
            l.append(_.str(res[res.length-1]));
            return l;
        }),
        startswith: $m({'start':null, 'end':null}, function(self, sub, start, end) {
            if (!_.isinstance(sub, [_.tuple, _.list]))
                sub = [sub]
            else
                sub = sub.as_js();
            if (start === null)start = 0;
            if (end === null)end = self._data.length;
            for (var i=0;i<sub.length;i++) {
                if (self._data.slice(start,end).indexOf(sub[i]) === 0)
                    return true;
            }
            return false;
        }),
        strip: __not_implemented__('str.strip'),
        swapcase: __not_implemented__('str.swapcase'),
        title: $m(function (self) {
            var parts = self.split(' ');
            for (var i=0;i<parts._list.length;i++) {
                parts._list[i] = parts._list[i].capitalize();
            }
            return _.str(' ').join(parts);
        }),
        translate: __not_implemented__('str.translate'),
        upper: $m(function(self) {
            return _.str(self._data.toUpperCase());
        }),
        zfill: __not_implemented__('str.zfill')
    });

    _.slice = Class('slice', [], {
        __init__: $m({}, true, function __init__(self, args) {
            if (_.len(args) > 3)
                _.raise(_.TypeError('slice() takes a max of 3 arguments'));
            args = args.as_js();
            if (args.length === 0)
                _.raise(_.TypeError('slice() takes at leat 1 argument (0 given)'));
            if (args.length === 1) {
                upper = args[0];
                lower = null;
                step = null;
            } else if (args.length === 2) {
                upper = args[1];
                lower = args[0];
                step = null;
            } else {
                lower = args[0];
                upper = args[1];
                step = args[2];
            }
            self.upper = upper;
            self.lower = lower;
            self.step = step;
        }),
        __str__: $m(function __str__(self) {
            return _.str('slice(' + self.lower + ', ' + self.upper + ', ' + self.step + ')');
        }),
        indices: $m(function indices(self, len) {
            var start = self.lower, stop = self.upper, step = self.step;
            if (start === null)start = 0;
            if (stop === null)stop = len;
            if (step === null)step = 1;
            if (start < 0) start += len;
            if (start < 0) start = 0;
            if (start > len) start = len;
            if (stop < 0) stop += len;
            if (stop < 0) stop = 0;
            if (stop > len) stop = len;
            return _.tuple([start, stop, step]);
        })
    });

    _.list = Class('list', [], {
        __init__: $m({'ible':[]}, function __init__(self, ible) {
            if (ible instanceof Array) {
                self._list = ible.slice();
            } else if (_.isinstance(ible, [_.tuple, _.list])) {
                self._list = ible.as_js().slice();
            } else {
                var __ = _.foriter(ible);
                self._list = [];
                while (__.trynext()){
                    self._list.push(__.value)
                }
            }
        }),
        as_js: $m(function as_js(self){
           return self._list;
        }),
        __add__: $m(function __add__(self, other) {
            if (!_.isinstance(other, _.list))
                _.raise(_.TypeError('can only concatenate list to list'));
            return _.list(self._list.concat(other._list));
        }),
        __contains__: $m(function __contains__(self, one){
            var at = -1;
            for (var i = 0; i < self._list.length; i++) {
                if (_.eq(one, self._list[i])) {
                    at = i;
                    break;
                }
            }
            return at !== -1;
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
            if (_.isinstance(index, _.slice)) {
                var nw = [];
                var sss = index.indices(self._list.length).as_js();
                for (var i=sss[0];i<sss[1];i+=sss[2])
                    nw.push(self._list[i]);
                return _.list(nw);
            } else if (typeof(index) === 'number') {
                if (index < 0) index += self._list.length;
                if (index < 0 || index >= self._list.length)
                    _.raise(_.IndexError('index out of range'));
                return self._list[index];
            } else
                _.raise(_.ValueError('index must be a number or slice'));
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
            if (typeof(other) != 'number')
                _.raise(_.TypeError('only can multiply by a number'));
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
            if (typeof(other) == 'number') {
                var res = []
                for (var i=0;i<other;i++) {
                    res = res.concat(self.as_js());
                }
                return _.list(res);
            }
            _.raise(_.TypeError('only can multiply by a number'));
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
        sort: __not_implemented__('sort'),
        __str__: $m(function __str__(self) {
            var a = [];
            for (var i=0;i<self._list.length;i++) {
                a.push(_.repr(self._list[i]));
            }
            return _.str('['+a.join(', ')+']');
        })
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
        next: $m(function(self) {
            if (self.at >= self.lst._list.length)
                _.raise(_.StopIteration());
            var val = self.lst._list[self.at];
            self.at += 1;
            return val;
        })
    });

    _.listreversediterator = Class('listreversediterator', [_.listiterator], {
        next: $m(function(self) {
            if (self.at >= self.lst._list.length)
                _.raise(_.StopIteration());
            var val = self.lst._list[self.lst._list.length-1-self.at];
            self.at += 1;
            return val;
        })
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

    /** for use in emulating python for loops. example:
     *
     * for a in b:
     *      pass
     *
     * becomes
     *
     * var __iter = foriter(b);
     * while (__iter.trynext()) {
     *      a = __iter.value;
     * }
     */
    _.foriter = Class('foriter', [], {
        __init__: $m(function(self, ible){
            self.iter = _.iter(ible);
            self.value = null;
        }),
        trynext: $m(function(self){
            try {
                self.value = self.iter.next();
            } catch (e) {
                if (_.isinstance(e, _.StopIteration))
                    return false;
                throw e;
            }
            return true;
        })
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

    _.type = $m(function (what) {
        if (typeof(what) === 'number')
            return _._int;
        if (what.__class__ !== undefined)
            return what.__class__;
        if (what.__type__ !== undefined)
            return that.__type__;
        return typeof(what);
    });
    _.classmethod = classmethod;
    _.staticmethod = staticmethod;

    _.isinstance = $m(function isinstance(inst, clsses) {
        if (inst === null || !defined(inst.__class__))
            return false;
            // _.raise("PJs Error: isinstance only works on objects");
        return _.issubclass(inst.__class__, clsses);
    });

    _.issubclass = $m(function issubclass(cls, clsses) {
        if (!defined(cls.__bases__))
            _.raise("PJs Error: issubclass only works on classes");
        if (clsses.__class__ === _.list || clsses.__class__ === _.tuple)
            clsses = clsses.as_js();
        if (!(clsses instanceof Array))
            clsses = [clsses];
        for (var i=0;i<clsses.length;i++) {
            if (cls === clsses[i]) return true;
        }
        for (var a=0;a<cls.__bases__.length;a++) {
            if (_.issubclass(cls.__bases__[a], clsses))
                return true;
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
    _.__package__ = __not_implemented__("__package__");
    _.round = $m(function round(what) {
        what = _.js(what);
        if (typeof(what) !== 'number')
          _.raise(_.TypeError('round() requires a number'));
        return _._float(Math.round(what));
    });
    _.dir = __not_implemented__("dir");
    _.cmp = __not_implemented__("cmp");
    _.set = __not_implemented__("set");
    _.bytes = __not_implemented__("bytes");
    _.reduce = __not_implemented__("reduce");
    _.intern = __not_implemented__("intern");
    _.Ellipsis = __not_implemented__("Ellipsis");
    _.locals = __not_implemented__("locals");
    _.sum = __not_implemented__("sum");
    _.getattr = __not_implemented__("getattr");
    _.abs = __not_implemented__("abs");
    _.exit = __not_implemented__("exit");
    _.print = $m({}, true, function _print(args) {
        var strs = [];
        for (var i=0;i<args._list.length;i++) {
            if (typeof(args._list[i]) === 'string')
                strs.push(":'" + args._list[i] + "':");
            strs.push(_.str(args._list[i]));
        }
        console.log(strs.join(' '));
    });
    _.print.__name__ = 'print';
    _.assert = $m(function assert(bool, text) {
        if (!bool) {
            _.raise(_.AssertionError(text));
        }
    });
    _._debug_stack = [];
    _.raise = $m(function raise(obj) {
        obj.stack = _._debug_stack.slice();
        throw obj;
    });
    _.True = true;
    _.False = false;
    _.None = null;
    _.len = $m(function len(obj) {
        if (obj instanceof Array) return obj.length;
        if (typeof(obj) === 'string') return obj.length;
        if (obj.__len__) return obj.__len__();
        _.raise(_.TypeError('no function __len__ in object <' + _.str(obj) + '> ' + typeof(obj)));
    });
    _.credits = __not_implemented__("credits");
    _.ord = __not_implemented__("ord");
    // _.super = __not_implemented__("super");
    _.license = __not_implemented__("license");
    _.KeyboardInterrupt = __not_implemented__("KeyboardInterrupt");
    _.filter = __not_implemented__("filter");
    _.range = $m({'end':null, 'step':1}, function(start, end, step) {
        if (end === null) {
            end = start;
            start = 0;
        }
        var res = _.list();
        for (var i=start;i<end;i+=step)
            res.append(i);
        return res;
    });
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
        if (item === null)
            return _.str('None');
        if (typeof(item) === 'string') {
            return ':' + _.str("'" + item + "'") + ':';
        } else if (typeof(item) === 'number') {
            return _.str('' + item);
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
    _.min = $m({}, true, function(args) {
        if (_.len(args) === 1)
            args = _.list(args.__getitem__(0));
        args = _.js(args);
        var m = null;
        for (var i=0;i<args.length;i++) {
            if (m === null || _.lt(args[i], m))
                m = args[i];
        }
        return m;
    });
    _.execfile = __not_implemented__("execfile");
    _.any = __not_implemented__("any");
    _.NotImplemented = (Class('NotImplementedType', [], {
        __str__:$m(function(self){return _.str('NotImplemented');})
    })());
    _.map = __not_implemented__("map");
    _.buffer = __not_implemented__("buffer");
    _.max = $m({}, true, function(args) {
        if (_.len(args) === 1)
            args = _.list(args.__getitem__(0));
        args = _.js(args);
        var m = null;
        for (var i=0;i<args.length;i++) {
            if (m === null || _.gt(args[i], m))
                m = args[i];
        }
        return m;
    });
    _.callable = __not_implemented__("callable");
    _.eval = __not_implemented__("eval");
    _.__debug__ = __not_implemented__("__debug__");

    _.BaseException = Class('BaseException', [], {
        __init__: $m({}, true, function __init__(self, args) {
            self.args = args;
        }),
        __str__: $m(function __str__(self) {
            if (_.len(self.args) == 1)
                return _.str(self.__class__.__name__+': '+_.str(self.args.__getitem__(0)));
            return _.str(self.__class__.__name__+': '+_.str(self.args));
        })
    });
    _.Exception = Class('Exception', [_.BaseException], {});
    _.StandardError = Class('StandardError', [_.Exception], {});
    _.TypeError = Class('TypeError', [_.StandardError], {});
    _.StopIteration = Class('StopIteration', [_.Exception], {});
    _.GeneratorExit = Class('GeneratorExit', [_.BaseException], {});
    _.SystemExit = Class('SystemExit', [_.BaseException], {});
    _.KeyboardInterrupt = Class('KeyboardInterrupt', [_.BaseException], {});
    _.ImportError = Class('ImportError', [_.StandardError], {});
    _.EnvironmentError = Class('EnvironmentError', [_.StandardError], {});
    _.IOError = Class('IOError', [_.EnvironmentError], {});
    _.OSError = Class('OSError', [_.EnvironmentError], {});
    _.EOFError = Class('EOFError', [_.StandardError], {});
    _.RuntimeError = Class('RuntimeError', [_.StandardError], {});
    _.NotImplementedError = Class('NotImplementedError', [_.RuntimeError], {});
    _.NameError = Class('NameError', [_.StandardError], {});
    _.UnboundLocalError = Class('UnboundLocalError', [_.NameError], {});
    _.AttributeError = Class('AttributeError', [_.StandardError], {});
    _.SyntaxError = Class('SyntaxError', [_.StandardError], {});
    _.IndentationError = Class('IndentationError', [_.SyntaxError], {});
    _.TabError = Class('TabError', [_.IndentationError], {});
    _.LookupError = Class('LookupError', [_.StandardError], {});
    _.IndexError = Class('IndexError', [_.LookupError], {});
    _.KeyError = Class('KeyError', [_.LookupError], {});
    _.ValueError = Class('ValueError', [_.StandardError], {});
    _.UnicodeError = Class('UnicodeError', [_.ValueError], {});
    _.UnicodeEncodeError = Class('UnicodeEncodeError', [_.UnicodeError], {});
    _.UnicodeDecodeError = Class('UnicodeDecodeError', [_.UnicodeError], {});
    _.UnicodeTranslateError = Class('UnicodeTranslateError', [_.UnicodeError], {});
    _.AssertionError = Class('AssertionError', [_.StandardError], {});
    _.ArithmeticError = Class('ArithmeticError', [_.StandardError], {});
    _.FloatingPointError = Class('FloatingPointError', [_.ArithmeticError], {});
    _.OverflowError = Class('OverflowError', [_.ArithmeticError], {});
    _.ZeroDivisionError = Class('ZeroDivisionError', [_.ArithmeticError], {});
    _.SystemError = Class('SystemError', [_.StandardError], {});
    _.ReferenceError = Class('ReferenceError', [_.StandardError], {});
    _.MemoryError = Class('MemoryError', [_.StandardError], {});
    _.BufferError = Class('BufferError', [_.StandardError], {});
    _.Warning = Class('Warning', [_.Exception], {});
    _.UserWarning = Class('UserWarning', [_.Warning], {});
    _.DeprecationWarning = Class('DeprecationWarning', [_.Warning], {});
    _.PendingDeprecationWarning = Class('PendingDeprecationWarning', [_.Warning], {});
    _.SyntaxWarning = Class('SyntaxWarning', [_.Warning], {});
    _.RuntimeWarning = Class('RuntimeWarning', [_.Warning], {});
    _.FutureWarning = Class('FutureWarning', [_.Warning], {});
    _.ImportWarning = Class('ImportWarning', [_.Warning], {});
    _.UnicodeWarning = Class('UnicodeWarning', [_.Warning], {});
    _.BytesWarning = Class('BytesWarning', [_.Warning], {});

    _.assertdefined = function assertdefined(x, name) {
        if (x === undefined)
            _.raise(_.NameError('undefined variable "' + name + '"'));
        return x;
    };
    _.output_exception = $m(function (e, stack) {
        var pf = __builtins__.print;
        // if __builtins__.print is in the stack, don't use it here
        for (var i=0;i<stack.length;i++) {
            if (stack[1] == pf) {
                console.log('using rhino\'s print -- error printing pythony');
                pf = console.log;
                break;
            }
        }
        pf('Traceback (most recent call last)');
        for (var i=0;i<stack.length;i++){
            var fn = stack[i][1];
            var ost = fn.toString;
            if (fn._to_String)
                fn.toString = fn._old_toString;
            pf('  ', stack[i][1]);
        }
        if (e.__class__)
            pf('Python Error:', e);
        else
            console.log('Javascript Error:', e);

     });
    _.run_main = $m(function(filename){
        try {
            __module_cache[filename].load('__main__');
        } catch (e) {
            var stack = __builtins__._debug_stack;
            _.output_exception(e, stack);
            throw e;
        }
    });

    _.definedor = function (what, or) {
      if (!defined(what)) return or;
      return what;
    };
});

__module_cache['<builtin>/sys.py'].load('sys'); // must be loaded for importing to work.
__module_cache['<builtin>/os/path.py'].load('os.path');
var __builtins__ = __module_cache['<builtin>/__builtin__.py'].load('__builtin__');
var __import__ = __builtins__.__import__; // should I make this global?
var $b = __builtins__;

