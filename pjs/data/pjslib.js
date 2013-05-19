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

    $def([defaults], [aflag], [kflag], fn);

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

    var foo = $def({c:null, d:10}, true, true, function foo(a, b, c, d, args, kwargs) { // 51 :builtin:
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
var fnrx = /function(?:\s+[\w_$]*)?\s*\(([\w,\s]*)\)/;

function defined(x){ // 79 :builtin:
    return typeof(x) != 'undefined';
}
/*
String.prototype.strip = function(){ // 83 :builtin:
    return this.replace(/^\s+/,'').replace(/\s+$/,'');
};
*/
function get_fn_args(func) { // 87 :builtin:
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
    
function check_defaults(func_args, defaults, argnum) { // 103 :builtin:
    var dflag = false;
    for (var i=0;i<argnum;i++) {
        if (defined(defaults[func_args[i]]))
            dflag = true;
        else if (dflag)
            return false;
    }
    return true;
}

function $def() { // 114 :builtin:
    var args = Array.prototype.slice.call(arguments);
    if (!args.length)
        throw new Error("JS Error: $def requires at least one argument.");
    var func = args.pop();
    var name = func.__name__ || func.name;
    if (typeof(func) !== 'function')
        throw new Error("JS Error: $def requires a function as the last argument");
    var func_args = get_fn_args(func);
    var defaults = args.length?args.shift():{};
    if (!(defaults instanceof Object))
        throw new Error("the defaults argument must be an object");
    var aflag = args.length?args.shift():false;
    var kflag = args.length?args.shift():false;
    if (args.length) throw new Error("JS Error: $def takes at most 4 arguments. (" + (4+args.length) + " given)");

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

    var meta = function $def_meta() { // 155 :builtin:
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
        if (__builtins__) {
            var pre_stack = __builtins__._debug_stack.slice();
            __builtins__._debug_stack.push([name, meta, args]);
        }
        var result = func.apply(null, args);
        if (__builtins__) {
            //var oft = __builtins__._debug_stack.pop();
            __builtins__._debug_stack = pre_stack;
        }
        if (result === undefined) result = null;
        return result;
    };

    meta.args = function $def_meta_args(args, dict) { // 197 :builtin:
        if (!defined(dict))
            throw new Error('TypeError: $def(fn).args must be called with both arguments.');
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
        if (__builtins__) {
            var pre_stack = __builtins__._debug_stack.slice();
            __builtins__._debug_stack.push([name, func, [args, dict]]);
        }
        var result = func.apply(null, args);
        if (__builtins__) {
            // var oft = __builtins__._debug_stack.pop();
            __builtins__._debug_stack = pre_stack;
        }
        if (result === undefined) result = null;
        return result;
    };
    meta.__wraps__ = func;
    meta.__type__ = func.__type__?func.__type__:'function';
    meta.__class__ = undefined;
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

function instancemethod(cls, fn) { // 295 :builtin:
    var meta = function $_instancemethod() { // 296 :builtin:
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
    meta.__str__ = function str(){ // 307 :builtin:
        return '<unbound method '+cls.__name__+'.'+meta.__name__+'>';
    };
    meta.im_class = cls;
    meta.im_func = fn;
    meta.im_self = null;
    meta.__get__ = function $_get(self, ncls) { // 313 :builtin:
        ncls = ncls||self.__class__;
        /*
        if (!__builtins__.isinstance(self, cls))
            throw new Error('idk what just happened... invalid self while binding instancemethod');
        */
        var m2 = function() { // 319 :builtin:
            return fn.apply(this, [self].concat(to_array(arguments)));
        };
        m2.__name__ = meta.__name__;
        m2.__type__ = instancemethod;
        m2.__wraps__ = fn;
        fn.__wraper__ = fn;
        m2.__str__ = function(){ // 326 :builtin:
            return $b.str('<bound method '+ncls.__name__+'.'+meta.__name__+' of '+$b.str(self)+'>');
        };
        m2.im_class = ncls;
        m2.im_func = fn;
        m2.im_self = self;
        m2.args = function $_args(pos, kwd) { // 332 :builtin:
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

function _set_name(fn, name) { // 345 :builtin:
    fn.__name__ = name;
    while(fn = fn.__wraps__)
        fn.__name__ = name;
}

var type = $def(function type(name, bases, namespace) { // 351 :builtin:
    var cls = function $_type() { // 352 :builtin:
        var self = function () { // 353 :builtin:
            if (self.__call__) {
                return self.__call__.apply(this, arguments);
            } else {
                $b.raise($b.TypeError($b.str(self).as_js() + ' has no attribute __call__'));
            }
        };
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
            } else {
                self[attr] = val;
            }
        }
        self.__init__.apply(null, arguments);
        self._old_toString = self.toString;
        if (self.__str__)
            self.toString = function(){ return self.__str__()._data; };
        return self;
    };
    var ts = cls.toString;
    var __setattr__ = $def(function class_setattr(key, val) { // 382 :builtin:
        if (val && val.__type__ === 'function' ||
                (val && !val.__type__ && typeof(val)==='function')) {
            cls[key] = instancemethod(cls, val);
            cls[key]._depth = 1;
        } else if (val && val.__type__ === classmethod) {
            cls[key] = val.__get__(cls);
        } else if (val && val.__type__ === staticmethod) {
            cls[key] = val.__get__(cls);
        } else if (val && val.__type__ === instancemethod) {
            cls[key] = instancemethod(cls, val.im_func);
            cls[key]._depth = val._depth + 1;
        } else
            cls[key] = val;
    });
    for (var i = bases.length - 1; i >= 0; i--) {
        for (var key in bases[i]) {
            if (key === 'prototype') continue;
            var val = bases[i][key];
            if (cls[key] && cls[key]._depth && val._depth && cls[key]._depth < val._depth + 1) {
                continue;
            }
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

function classmethod(val) { // 418 :builtin:
    var clsm = {};
    clsm.__get__ = function(cls) { // 420 :builtin:
        return instancemethod(cls, val).__get__(cls);
    };
    clsm.__type__ = classmethod;
    clsm.__str__ = function(){return '<classmethod object at 0x10beef01>';};
    return clsm;
}
/*
function __classmethod(cls, val){ // 428 :builtin:
    var fn = function() { // 429 :builtin:
        return val.apply(this, [cls].concat(to_array(arguments)));
    };
    if (val.args) {
        fn.args = function(pos, kwd) { // 433 :builtin:
            return val.args([cls].concat(pos), kwd);
        };
    }
    fn.__type__ = 'classmethod';
    fn.__wraps__ = val;
    return fn;
}

// decorators
function classmethod(method){ // 443 :builtin:
    method.__cls_classmethod = true;
    return method;
}
*/
function staticmethod(method){ // 448 :builtin:
    var obj = {};
    obj.__type__ = staticmethod;
    var blessed = function() { // 451 :builtin:
        return method.apply(null, arguments);
    };
    blessed.__type__ = 'blessed_static';
    obj.__get__ = function(){ // 455 :builtin:
        return blessed;
    };
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
function module(filename, fn) { // 496 :builtin:
    var that = {};
    that.__file__ = filename;
    that.__init__ = fn;
    that.load = $def({'mod':null}, function load_module(name, mod) { // 500 :builtin:
        if (mod === null) mod = {};
        mod.__name__ = name;
        if (__builtins__) mod.__name__ = __builtins__.str(name);
        mod.__file__ = that.__file__;
        if (__builtins__) mod.__file__ = __builtins__.str(that.__file__);
        mod.__dict__ = mod;
        mod.__type__ = 'module';
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
    $(function (){ // 569 :builtin:
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
        consolediv.click(function () { // 582 :builtin:
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
        window.console = {log: function () { // 596 :builtin:
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

var __not_implemented__ = function __not_implemented__(name) { // 612 :builtin:
    return function not_implemented() { // 613 :builtin:
        if (arguments.callee.__name__)
            name = arguments.callee.__name__;
        $b.raise($b.NotImplementedError("the builtin function "+name+" is not implemented yet. You should help out and add it =)"));
    };
};

module('<builtin>/sys.py', function sys_module(_) { // 620 :builtin:
    _.__doc__ = "The PJs module responsible for system stuff";
    _.modules = {'sys':_}; // sys and __builtin__ won't be listed
                             // it doesn't make sense for them to be
                             // reloadable.
    _.path = []; //'.', '<builtin>'];
    _.exit = $def({'code':0}, function exit(code) { // 626 :builtin:
        _.raise("SystemExit: sys.exit() was called with code "+code);
    });
});

module('<builtin>/os/__init__.py', function os_module(_) {
 // 631 :builtin:
});

module('<builtin>/os/path.py', function os_path_module(_) { // 635 :builtin:
    _.__doc__ = "a module for dealing with paths";
    _.join = $def({}, true, function join(first, args) { // 637 :builtin:
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
    _.isabs = $def(function isabs(path) { // 652 :builtin:
        path = $b.js(path);
        if (!path)return false;
        return path && path[0] == '/';
    });
    _.abspath = $def(function abspath(path) { // 657 :builtin:
        path = $b.js(path);
        if (!_.isabs(path))
            _.raise("not implementing this atm");
        return _.normpath(path);
    });
    _.dirname = $def(function dirname(path) { // 663 :builtin:
        path = $b.js(path);
        return $b.str(path.split('/').slice(0,-1).join('/') || '/');
    });
    _.basename = $def(function basename(path) { // 667 :builtin:
        path = $b.js(path);
        return $b.str(path.split('/').slice(-1)[0]);
    });
    _.normpath = $def(function normpath(path) { // 671 :builtin:
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
 // 693 :builtin:
    var sys = __module_cache['<builtin>/sys.py']._module;

    _.__doc__ = 'Javascript corrospondences to python builtin functions';

    _.py = $def(function py(what) { // 699 :builtin:
        if (what === null || what.__class__) return what;
        if (what instanceof Array) {
            var nw = [];
            for (var i = 0; i < what.length; i++) {
                nw.push(_.py(what[i]));
            }
            return _.list(nw);
        } else if (typeof(what) === 'string') {
            return _.str(what);
        } else if (typeof(what) === 'number') {
            if (what === Math.round(what)) {
                return what; // int
            } else {
                return _._float(what);
            }
        } else {
            var dct = {};
            for (var k in what) {
                dct[k] = _.py(what[k]);
            }
            return _.dict(dct);
        }
    });

    _.js = $def(function js(what) { // 724 :builtin:
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
        if (typeof(what) === 'function') {
          if (defined(what.as_js)) {
              return what.as_js();
          } else if (what.__class__ !== undefined && undefined === what.__call__) {
              _.raise(_.TypeError('Cannot convert object ' + _.str(what).as_js() + ' of type ' + _.str(_.type(what)) + ' to javascript (no __call__ method or as_js)'));
          }/* else if (what.__type__ !== 'function') {
              _.raise(_.TypeError('Cannot coerce to javascript'));
          }*/
          var wrapper = function $_function_wrapper() { // 750 :builtin:
            _._debug_stack.push(['wrapper', '[from javascript call]']);
            try {
              var res = what.apply(this, arguments);
            } catch (e) {
              var stack = __builtins__._debug_stack;
              _.output_exception(e, stack);
              throw e;
            }
            _._debug_stack.pop();
            return res;
          };
          wrapper.__name__ = what.__name__ || what.name;
          wrapper.__class__ = what.__class__;
          wrapper.__type__ = what.__type__;
          wrapper.__wraps__ = what;
          what.__wrapped__ = wrapper;
          return wrapper;
        }
        return what;
    });
    _.js.__module__ = _.__name__;
    _.js.__file__ = _.__file__;
    /** importing modules **/
    _.__import__ = $def({'file':'','from':''},
      function __import__(name, from, file) { // 775 :builtin:
        name = $b.js(name);
        if (defined(sys.modules[$b.py(name)]))
            return sys.modules[$b.py(name).split('.').__getitem__(0)];
        var parent_mod = null;
        if (name.split('.').length > 1) {
            parent_mod = _.__import__(name.split('.').slice(0, -1).join('.'), from, file);
        }
        from = $b.js(from);
        file = $b.js(file);
        var path = __module_cache['<builtin>/os/path.py']._module;
        var relflag = false;
        var foundat = null;
        var syspath = ['.', '<builtin>'].concat($b.js(sys.path));
        for (var i=0;i<syspath.length;i++) {
            relflag = syspath[i][0] !== '/' && syspath[i].indexOf('<builtin>') !== 0;
            if (relflag)
                var dname = $b.js(path.normpath(path.join(path.dirname(file), syspath[i])));
            else
                var dname = $b.js(syspath[i]);
            var fname = $b.js(path.join(dname, $b.js(name).replace('.', '/')));
            if (defined(__module_cache[fname+'.py'])) {
                foundat = fname+'.py';
                break;
            } else if (defined(__module_cache[fname+'/__init__.py'])) {
                foundat = fname + '/__init__.py';
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
        if (parent_mod !== null) {
            var name_parts = name.split('.');
            var direct_parent = parent_mod;
            for (var i=1;i<name_parts.length - 1;i++){
                // print(name_parts, i, direct_parent.__name__);
                direct_parent = direct_parent[name_parts[i]];
            }
            direct_parent[name_parts[name_parts.length-1]] = sys.modules[mname];
            // parent_mod[name.split('.').slice(1, -1).join('.')] = sys.modules[mname];
            return parent_mod;
        }
        return sys.modules[mname];
    });

    _.reload = $def(function reload(module) { // 829 :builtin:
        delete sys.modules[module.__name__];
        // TODO: this could cause problems, not providing a source file or
        // source name...import might not go through
        return _.__import__(module.__name__);
    });

    /** operators **/
    _.do_op = $def(function do_op(op, rop, a, b) { // 837 :builtin:
        var val;
        if (a && a[op] && (a[op].__type__ !== instancemethod || a[op].im_self)) {
            val = a[op](b);
            if (val !== _.NotImplemented)
                return val;
        }
        if (b && b[rop] && (b[op].__type__ !== instancemethod || b[op].im_self)) {
            return b[rop](a);
        }
        return _.NotImplemented;

    });
    _.do_ops = $def({}, true, function do_ops(allthem) { // 850 :builtin:
        var ops = {'in':_._in, 'not in':_.not_in, '<':_.lt,'>':_.gt,'<=':_.lte,'>=':_.gte,'==':_.eq,'!=':_.ne};
        if (_.len(allthem) % 2 === 0)
            _.raise(_.ValueError('do_ops requires an odd number of arguments'));
        allthem = allthem.as_js();
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
    _._in = $def(function _in(a, b) { // 871 :builtin:
        if (b === null || !b.__contains__) {
            _.raise(_.TypeError(_.str(b).as_js() + ' has no method __contains__'));
        }
        return b.__contains__(a);
    });
    _.not_in = $def(function not_in(a, b) { // 877 :builtin:
        return !_._in(a, b);
    });
    _.add = $def(function add(a, b) { // 880 :builtin:
        var val = _.do_op('__add__', '__radd__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a + b;
            else if (typeof(a) === typeof(b) && typeof(a) === 'string')
                return a + b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for + ' + _.str(_.type(a)) + ' and ' + _.str(_.type(b))));
        } else
            return val;
    });
    _.add.__module__ = _.__name__;
    _.sub = $def(function sub(a, b) { // 893 :builtin:
        var val = _.do_op('__sub__', '__rsub__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a - b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for -'));
        } else
            return val;
    });
    _.gt = $def(function gt(a, b) { // 903 :builtin:
        var val = _.do_op('__gt__', '__lt__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a > b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for >'));
        } else
            return val;
    });
    _.lt = $def(function lt(a, b) { // 913 :builtin:
        return !_.gte(a, b);
    });
    _.gte = $def(function ge(a, b) { // 916 :builtin:
        var val = _.do_op('__ge__', '__le__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a >= b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for >=', _.type(a), _.type(b)));
        } else
            return val;
    });
    _.lte = $def(function le(a, b) { // 926 :builtin:
        return !_.gt(a, b);
    });
    _.mod = $def(function mod(a, b) { // 929 :builtin:
        var val = _.do_op('__mod__', '__rmod__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a % b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.mult = $def(function mul(a, b) { // 939 :builtin:
        var val = _.do_op('__mul__', '__rmul__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a * b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for *'));
        } else
            return val;
    });
    _.ne = $def(function ne(a, b) { // 949 :builtin:
        var val = _.do_op('__ne__', '__ne__', a, b);
        if (val === _.NotImplemented) {
              return a !== b;
        } else
            return val;
    });
    _.eq = $def(function eq(a, b) { // 956 :builtin:
        var val = _.do_op('__eq__', '__eq__', a, b);
        if (val === _.NotImplemented) {
              return a === b;
        } else
            return val;
    });
    _.div = $def(function div(a, b) { // 963 :builtin:
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
        __init__: $def({'itable':{}}, function __init__(self, itable){ // 979 :builtin:
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
        as_js: $def(function as_js(self) { // 1016 :builtin:
            var dct = {};
            for (var i=0;i<self._keys.length;i++){
                dct[self._keys[i]] = self._values[i];
            }
            return dct;
        }),
        __cmp__: $def(function __cmp__(self, other){ // 1023 :builtin:
            _.raise(_.AttributeError('not yet implemented'));
        }),
        __contains__: $def(function __contains__(self, key){ // 1026 :builtin:
            return self.keys().__contains__(key);
        }),
        __delitem__: $def(function __delitem__(self, key){ // 1029 :builtin:
            if (!self.keys().__contains__(key)) {
                _.raise(_.KeyError(_.repr(key).as_js() + ' not in dictionary ' + _.repr(self._keys).as_js()));
            }
            var at = self.keys().index(key);
            self._keys = self._keys.slice(0, at).concat(self._keys.slice(at+1));
            self._values = self._values.slice(0, at).concat(self._values.slice(at+1));
        }),
        __delattr__: $def(function __delattr__(self, key){ // 1037 :builtin:
            _.raise(_.KeyError('doesnt make sense'));
        }),
        __doc__: 'builtin dictionary type',
        __eq__: $def(function __eq__(self, dct){ // 1041 :builtin:
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
        __getitem__: $def(function __getitem__(self, key) { // 1054 :builtin:
            if (!self.keys().__contains__(key)) {
                _.raise(_.KeyError(_.repr(key).as_js() + ' not in dictionary ' + _.repr(self._keys).as_js()));
            }
            var at = self.keys().index(key);
            return self._values[at];
        }),
        __hash__: null,
        __iter__: $def(function __iter__(self) { // 1062 :builtin:
            return self.keys().__iter__();
        }),
        __len__: $def(function __len__(self){ // 1065 :builtin:
            return self.keys().__len__();
        }),
        __repr__: $def(function __repr__(self){ // 1068 :builtin:
            return self.__str__();
        }),
        __setitem__: $def(function __setitem__(self, key, value){ // 1071 :builtin:
            if (self.keys().__contains__(key)) {
                var i = self.keys().index(key);
                self._values[i] = value;
            } else {
                self._keys.push(key);
                self._values.push(value);
            }
        }),
        __str__: $def(function __str__(self){ // 1080 :builtin:
            var strs = [];
            for (var i=0;i<self._keys.length;i++){
                strs.push(_.repr(self._keys[i])+': '+_.repr(self._values[i]));
            }
            return _.str('{'+strs.join(', ')+'}');
        }),
        clear: $def(function clear(self){ // 1087 :builtin:
            delete self._keys;
            delete self._values;
            self._keys = [];
            self._values = [];
        }),
        copy: $def(function copy(self){ // 1093 :builtin:
            return _.dict(self);
        }),
        fromkeys: classmethod($def({'v':null}, function fromkeys(cls, keys, v){ // 1096 :builtin:
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
        get: $def({'def':null}, function get(self, key, def){ // 1110 :builtin:
            var i = self._keys.indexOf(key);
            if (i !== -1)
                return self._values[i];
            return def;
        }),
        has_key: $def(function has_key(self, key){ // 1116 :builtin:
            return self.__contains__(key);
        }),
        items: $def(function items(self){ // 1119 :builtin:
            var items = [];
            for (var i=0;i<self._keys.length;i++) {
                items.push(_.list([self._keys[i], self._values[i]]));
            }
            return _.list(items);
        }),
        iteritems: $def(function iteritems(self){ // 1126 :builtin:
            // TODO: nasty hack...doesn't actually get you any lazy benefits
            return self.items().__iter__();
        }),
        iterkeys: $def(function iterkeys(self){ // 1130 :builtin:
            return self.keys().__iter__();
        }),
        itervalues: $def(function itervalues(self){ // 1133 :builtin:
            return self.values().__iter__();
        }),
        keys: $def(function keys(self){ // 1136 :builtin:
            return _.list(self._keys.slice());
        }),
        pop: $def({'default_':null}, function pop(self, key, default_){ // 1139 :builtin:
            var i = self._keys.indexOf(key);
            if (i !== -1) {
                var v = self._values[i];
                self.__delitem__(key);
                return v;
            }
            return default_;
        }),
        popitem: $def(function popitem(self){ // 1148 :builtin:
            if (self.__len__()==0)
                _.raise(_.KeyError('popitem(): dictionary is empty'));
            return self.pop(self._keys[0]);
        }),
        setdefault: $def(function setdefault(self, k, d){ // 1153 :builtin:
            if (!self.has_key(k))
                self.__setitem__(k, d);
            return self.__getitem__(k);
        }),
        update: $def(function update(self, other){ // 1158 :builtin:
            var keys = _.dict(other).keys().as_js();
            for (var i=0;i<keys.length;i++){
                self.__setitem__(keys[i], other.__getitem__(keys[i]));
            }
        }),
        values: $def(function values(self){ // 1164 :builtin:
            return _.list(self._values.slice());
        })
    });

    _.unicode = __not_implemented__("unicode");
    _.bytearray = __not_implemented__("bytearray");
    _.object = __not_implemented__("object");
    _.complex = __not_implemented__("complex");

    _.bool = $def(function bool(what) { // 1174 :builtin:
        if (what === null) {
            return false;
        }
        if (defined(what.__nonzero__))
            return what.__nonzero__();
        else if (defined(what.__len__))
            return _.len(what) !== 0;
        if (what)
            return true;
        return false;
    });

    _._int = $def(function _int(what) { // 1187 :builtin:
        if (typeof(what) === 'string' || _.isinstance(what, _.str)) {
            what = _.js(what);
            if (what.indexOf('.') !== -1 || isNaN(parseInt(what))) {
                _.raise(_.ValueError('can\'t coerce to an int'));
            }
            return parseInt(what);
        } else if (typeof(what) === 'number'){
            if (what < 0) return Math.ceil(what);
            return Math.floor(what);
        } else if (what && what.__class__ == _._float) {
            if (what._data < 0) return Math.ceil(what._data);
            return Math.floor(what._data);
        } else
            _.raise(_.ValueError('can\'t coerce to int'));
    });
    _._float = Class('float', [], {
        __init__: $def({'what':0.0}, function __init__(self, what) { // 1204 :builtin:
            if (typeof(what) == 'string') {
                self._data = parseFloat(what);
            } else if (typeof(what) == 'number') {
                self._data = what;
            } else if (what && _.isinstance(what, _._float)) {
                self._data = what._data;
            } else {
                _.raise(_.ValueError('can\'t coerce to float'));
            }
        }),
        __nonzero__: $def(function(self){ // 1215 :builtin:
            return self._data !== 0.0;
        }),
        as_js: $def(function(self){ // 1218 :builtin:
            return self._data;
        }),
        __str__: $def(function (self) { // 1221 :builtin:
            return _.str('' + self._data);
        }),
        __div__: $def(function __div__(self, other) { // 1224 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _._float(self._data/_.js(other));
            }
            return _.NotImplemented;
        }),
        __rdiv__: $def(function __rdiv__(self, other) { // 1230 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _._float(_.js(other)/self._data);
            }
            return _.NotImplemented;
        }),
        __add__: $def(function __add__(self, other) { // 1236 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _._float(_.js(other) + self._data);
            }
            return _.NotImplemented;
        }),
        __radd__: $def(function __radd__(self, other) { // 1242 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _._float(_.js(other) + self._data);
            }
            return _.NotImplemented;
        }),
        __mul__: $def(function __mul__(self, other) { // 1248 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _._float(_.js(other) * self._data);
            }
            return _.NotImplemented;
        }),
        __rmul__: $def(function __rmul__(self, other) { // 1254 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _._float(_.js(other) * self._data);
            }
            return _.NotImplemented;
        }),
        __sub__: $def(function __sub__(self, other) { // 1260 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _._float(self._data - _.js(other));
            }
            return _.NotImplemented;
        }),
        __rsub__: $def(function __rsub__(self, other) { // 1266 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _._float(_.js(other) - self._data);
            }
            return _.NotImplemented;
        }),
        __gt__: $def(function __gt__(self, other) { // 1272 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _.js(other) > self._data;
            }
            return _.NotImplemented;
        }),
        __ge__: $def(function __ge__(self, other) { // 1278 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _.js(other) >= self._data;
            }
            return _.NotImplemented;
        }),
        __lt__: $def(function __lt__(self, other) { // 1284 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _.js(other) < self._data;
            }
            return _.NotImplemented;
        }),
        __le__: $def(function __le__(self, other) { // 1290 :builtin:
            if ([_._int, _._float].indexOf(_.type(other)) !== -1) {
                return _.js(other) <= self._data;
            }
            return _.NotImplemented;
        }) 
    });


    _.tuple = Class('tuple', [], {
        __init__: $def({'ible':[]}, function __init__(self, ible) { // 1300 :builtin:
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
        as_js: $def(function as_js(self){ // 1317 :builtin:
           return self._list;
        }),
        __add__: $def(function __add__(self, other) { // 1320 :builtin:
            if (!_.isinstance(other, _.tuple))
                _.raise(_.TypeError('can only concatenate tuple to tuple'));
            return _.tuple(self._list.concat(other._list));
        }),
        __contains__: $def(function __contains__(self, one){ // 1325 :builtin:
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
        __eq__: $def(function __eq__(self, other){ // 1336 :builtin:
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
        __getitem__: $def(function __getitem__(self, index) { // 1348 :builtin:
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
        __getslice__: $def(function __getslice__(self, a, b) { // 1364 :builtin:
            return _.tuple(self._list.slice(a,b));
        }),
        __gt__: __not_implemented__(''),
        __hash__: __not_implemented__(''),
        __iter__: $def(function __iter__(self) { // 1369 :builtin:
            return _.tupleiterator(self);
        }),
        __le__: __not_implemented__(''),
        __len__: $def(function __len__(self) { return self._len; }),
        __lt__: __not_implemented__(''),
        __mul__: $def(function __mul__(self, other) { // 1375 :builtin:
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
        __repr__: $def(function __repr__(self) { return self.__str__(); }),
        __rmul__: $def(function __rmul__(self, other) { // 1389 :builtin:
            return self.__mul__(other);
        }),
        count: $def(function count(self, value) { // 1392 :builtin:
            var c = 0;
            for (var i=0;i<self._len;i++) {
                if (_.eq(self._list[i], value))
                    c++;
            }
            return c;
        }),
        index: $def(function index(self, value) { // 1400 :builtin:
            for (var i=0;i<self._len;i++) {
                if (_.eq(self._list[i], value))
                    return i;
            }
            _.raise(_.ValueError('x not in list'));
        }),
        __str__: $def(function __str__(self) { // 1407 :builtin:
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
    _.floordiv = $def(function floordiv(a, b) { // 1423 :builtin:
        return Math.floor(a/b);
    });

    _._get_function_name = function (fn) { // 1427 :builtin:
        var inner = fn;
        var name = fn.__name__;
        while (fn.__wraps__) {
            fn = fn.__wraps__;
            if (!name) name = fn.__name__;
        }
        return name;
    };

    _.str = Class('str', [], {
        __init__: $def({'item':''}, function __init__(self, item) { // 1438 :builtin:
            if (item === null)
                self._data = 'None';
            else if (typeof(item) === 'string')
                self._data = item;
            else if (typeof(item) === 'number')
                self._data = '' + item;
            else if (typeof(item) === 'boolean')
                self._data = _.str('' + item).title()._data;
            else if (defined(item.__str__) && (item.__str__.im_self || !item.__str__.__type__)) {
                self._data = _.js(item.__str__());
            } else if (item.__type__ === 'type')
                self._data = "<class '" + item.__module__ + '.' + item.__name__ + "'>";
            else if (item.__type__ === 'module')
                self._data = "<module '" + item.__name__ + "' from '" + item.__file__ + "'>";
            else if (item.__class__)
                self._data = '<' + item.__class__.__module__ + '.' + item.__class__.__name__
                                + ' instance at 0xbeaded>';
            else if (item instanceof Array) {
                var m = [];
                for (var i = 0; i<item.length; i++) {
                    m.push(_.repr(item[i]));
                }
                self._data = '[:' + m.join(', ') + ':]';
            } else if (item instanceof Function) {
                var _name = _._get_function_name(item);
                while (item.__wraps__) {
                    item = item.__wraps__;
                }
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
                    m.push("'"+a+"': "+item[a]); //_.repr(item[a]));
                }
                self._data = '{: '+m.join(', ')+' :}';
            } else {
                self._data = ''+item;
            }
        }),
        __iter__: $def(function __iter__(self) { // 1497 :builtin:
            var lst = _.list();
            for (var i=0;i<self._data.length;i++) {
                lst.append(_.str(self._data[i]));
            }
            return _.iter(lst);
        }),
        __str__: $def(function __str__(self) { // 1504 :builtin:
            return self;
        }),
        __len__: $def(function __len__(self) { // 1507 :builtin:
            return self._data.length;
        }),
        __repr__: $def(function __repr__(self) { // 1510 :builtin:
            // TODO: implement string_escape
            return _.str("'" + self._data.replace('\n','\\n') + "'");
        }),
        __add__: $def(function __add__(self, other) { // 1514 :builtin:
            if (_.isinstance(other, _.str))
                return _.str(self._data + other._data);
            if (typeof(other) === 'string')
                return _.str(self._data + other);
            return _.NotImplemented;
        }),
        __contains__: $def(function __contains__(self, other) { // 1521 :builtin:
            return self.find(other) !== -1;
        }),
        __eq__: $def(function __eq__(self, other) { // 1524 :builtin:
            if (typeof(other) === 'string')
                other = _.str(other);
            if (!_.isinstance(other, _.str))
                return false;
            return self._data === other._data;
        }),
        __ne__: $def(function __ne__(self, other) { // 1531 :builtin:
            return !self.__eq__(other);
        }),
        __format__: __not_implemented__('no formatting'),
        __ge__: $def(function __ge__(self, other) { // 1535 :builtin:
            return self.__cmd__(other) === -1;
        }),
        __getitem__: $def(function __getitem__(self, at) { // 1538 :builtin:
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
        __getslice__: $def(function __getslice__(self, i, j) { // 1555 :builtin:
            if (i<0) i = 0;
            if (j<0) j = 0;
            return _.str(self._data.slice(i,j));
        }),
        __mod__: $def(function __mod__(self, other) { // 1560 :builtin:
            if (!_.isinstance(other, [_.tuple, _.dict])) {
                other = [other];
            } else {
                other = other.as_js();
            }
            var at = 0;
            return _.str();
            if (other instanceof Array) {
                while (at < other.length) {
                    var next = self._data.indexOf('%', at)
                    var farg = self._data[next+1];
                    if (farg === '%') {
                        at = next + 1;
                        continue;
                    }
                }
            } else { // dict

            }
        }),
        toString: $def(function toString(self) { // 1581 :builtin:
            return self._data;
        }),
        as_js: $def(function as_js(self) { // 1584 :builtin:
            return self._data;
        }),
        capitalize: $def(function capitalize(self) { // 1587 :builtin:
            var s = self._data[0].toUpperCase();
            return _.str(s + self._data.slice(1).toLowerCase());
        }),
        center: __not_implemented__('str.center'),
        count: __not_implemented__('str.count'),
        decode: __not_implemented__('str.decode'),
        encode: __not_implemented__('str.encode'),
        endswith: $def(function endswith(self, what) { // 1595 :builtin:
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
        find: $def({'start':null, 'end':null}, function find(self, sub, start, end) { // 1607 :builtin:
            if (start === null) start = 0;
            if (end === null) end = self._data.length;
            var at = self._data.slice(start,end).indexOf(sub);
            if (at !== -1)at += start;
            return at;
        }),
        format: __not_implemented__('str.format'),
        index: $def({'start':null, 'end':null}, function index(self, sub, start, end) { // 1615 :builtin:
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
        join: $def(function join(self, ible) { // 1628 :builtin:
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
        lower: $def(function(self) { // 1643 :builtin:
            return _.str(self._data.toLowerCase());
        }),
        lstrip: __not_implemented__('str.lstrip'),
        partition: __not_implemented__('str.partition'),
        replace: __not_implemented__('str.replace'),
        rfind: __not_implemented__('str.rfind'),
        rindex: __not_implemented__('str.rindex'),
        split: $def({'sub':' ', 'count':-1}, function split(self, sub, count) { // 1651 :builtin:
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
        splitlines: $def({'keepends':false}, function splitlines(self, keepends) { // 1672 :builtin:
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
        startswith: $def({'start':null, 'end':null}, function startswith(self, sub, start, end) { // 1683 :builtin:
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
        title: $def(function title(self) { // 1698 :builtin:
            var parts = self.split(' ');
            for (var i=0;i<parts._list.length;i++) {
                parts._list[i] = parts._list[i].capitalize();
            }
            return _.str(' ').join(parts);
        }),
        translate: __not_implemented__('str.translate'),
        upper: $def(function(self) { // 1706 :builtin:
            return _.str(self._data.toUpperCase());
        }),
        zfill: __not_implemented__('str.zfill')
    });

    _.slice = Class('slice', [], {
        __init__: $def({}, true, function __init__(self, args) { // 1713 :builtin:
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
        __str__: $def(function __str__(self) { // 1736 :builtin:
            return _.str('slice(' + self.lower + ', ' + self.upper + ', ' + self.step + ')');
        }),
        indices: $def(function indices(self, len) { // 1739 :builtin:
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
        __init__: $def({'ible':[]}, function __init__(self, ible) { // 1755 :builtin:
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
        as_js: $def(function as_js(self){ // 1768 :builtin:
           return self._list;
        }),
        __add__: $def(function __add__(self, other) { // 1771 :builtin:
            if (!_.isinstance(other, _.list))
                _.raise(_.TypeError('can only concatenate list to list'));
            return _.list(self._list.concat(other._list));
        }),
        __contains__: $def(function __contains__(self, one){ // 1776 :builtin:
            var at = -1;
            for (var i = 0; i < self._list.length; i++) {
                if (_.eq(one, self._list[i])) {
                    at = i;
                    break;
                }
            }
            return at !== -1;
        }),
        __delitem__: $def(function __delitem__(self, i) { // 1786 :builtin:
            self._list = self._list.slice(0, i).concat(self._list.slice(i+1));
        }),
        __delslice__: $def(function __delslice__(self, a, b) { // 1789 :builtin:
            self._list = self._list.slice(0, a).concat(self._list.slice(b));
        }),
        __doc__: 'javascript equivalent of the python builtin list class',
        __eq__: $def(function __eq__(self, other){ // 1793 :builtin:
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
        __getitem__: $def(function __getitem__(self, index) { // 1805 :builtin:
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
        __getslice__: $def(function __getslice__(self, a, b) { // 1820 :builtin:
            return _.list(self._list.slice(a,b));
        }),
        __gt__: __not_implemented__(''),
        __iadd__: $def(function __iadd__(self, other) { // 1824 :builtin:
            if (!_.isinstance(other, _.list))
                __builtins__.raise(_.TypeError('can only add list to list'));
            self._list = self._list.concat(other._list);
        }),
        __imul__: $def(function __imul__(self, other) { // 1829 :builtin:
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
        __iter__: $def(function __iter__(self) { // 1840 :builtin:
            return _.listiterator(self);
        }),
        __le__: __not_implemented__(''),
        __len__: $def(function __len__(self) { return self._list.length; }),
        __lt__: __not_implemented__(''),
        __mul__: $def(function __mul__(self, other) { // 1846 :builtin:
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
        __ne__: $def(function __ne__(self, other) { // 1858 :builtin:
            return !self.__eq__(other);
        }),
        __repr__: $def(function __repr__(self) { return self.__str__(); }),
        __reversed__: $def(function __reversed__(self) { // 1862 :builtin:
            return _.listreversediterator(self);
        }),
        __rmul__: $def(function __rmul__(self, other) { // 1865 :builtin:
            return self.__mul__(other);
        }),
        __setitem__: $def(function __setitem__(self, i, val) { // 1868 :builtin:
            if (i < 0) i += self._list.length;
            if (i < 0 || i >= self._list.length)
                _.raise(_.IndexError('list index out of range'));
            self._list[i] = val;
        }),
        __setslice__: $def(function __setslice__(self, i, j, val) { // 1874 :builtin:
            var it = _.list(val)._list;
            self._list = self._list.slice(0, i).concat(it).concat(self._list.slice(j));
        }),
        append: $def(function append(self, what){ // 1878 :builtin:
            self._list.push(what);
        }),
        count: $def(function count(self, value) { // 1881 :builtin:
            var c = 0;
            for (var i=0;i<self._list.length;i++) {
                if (_.eq(self._list[i], value))
                    c++;
            }
            return c;
        }),
        extend: $def(function extend(self, what) { // 1889 :builtin:
            self.__iadd__(_.list(what));
        }),
        index: $def(function index(self, value) { // 1892 :builtin:
            for (var i=0;i<self._list.length;i++) {
                if (_.eq(self._list[i], value))
                    return i;
            }
            _.raise(_.ValueError('x not in list'));
        }),
        insert: $def(function insert(self, i, val) { // 1899 :builtin:
            self._list = self._list.slice(0, i).concat([val]).concat(self._list.slice(i));
        }),
        pop: $def({'i':-1}, function pop(self, i) { // 1902 :builtin:
            if (i < 0) i += self._list.length;
            if (i < 0 || i >= self._list.length)
                __builtins__.raise(_.IndexError('pop index out of range'));
            var val = self._list[i];
            self.__delitem__(i);
            return val;
        }),
        remove: $def(function(self, val) { // 1910 :builtin:
            var i = self.index(val);
            self.__delitem__(i);
        }),
        reverse: $def(function(self) { // 1914 :builtin:
            var ol = self._list;
            self._list = [];
            for (var i=ol.length-1;i>=0;i--) {
                self._list.push(ol[i]);
            }
        }),
        sort: $def({'cmp':null}, function(self, cmp) { // 1921 :builtin:
            if (cmp !== null)
                _.raise(_.NotImplementedError('sorting is not yet fully supported'));
            self._list.sort();
        }),
        __str__: $def(function __str__(self) { // 1926 :builtin:
            var a = [];
            for (var i=0;i<self._list.length;i++) {
                a.push(_.repr(self._list[i]));
            }
            return _.str('['+a.join(', ')+']');
        })
    });

    _.listiterator = Class('listiterator', [], {
        __init__: $def(function(self, lst) { // 1936 :builtin:
            self.lst = lst;
            self.at = 0;
            self.ln = lst._list.length;
        }),
        __iter__: $def(function(self){ // 1941 :builtin:
            return self;
        }),
        next: $def(function(self) { // 1944 :builtin:
            if (self.at >= self.lst._list.length)
                _.raise(_.StopIteration());
            var val = self.lst._list[self.at];
            self.at += 1;
            return val;
        })
    });

    _.listreversediterator = Class('listreversediterator', [_.listiterator], {
        next: $def(function(self) { // 1954 :builtin:
            if (self.at >= self.lst._list.length)
                _.raise(_.StopIteration());
            var val = self.lst._list[self.lst._list.length-1-self.at];
            self.at += 1;
            return val;
        })
    });

    _.tupleiterator = Class('tupleiterator', [_.listiterator], {});

    _.listcomp = $def(function listcomp(ibles, func, ifs) { // 1965 :builtin:
        var idexes = [];
        if (ibles.as_js) iters = ibles.as_js();
        var iters = [];
        for (var i=0;i<ibles.length;i++) {
            iters.push(null);
        }
        if (ifs.as_js) ifs = ifs.as_js();
        for (var i=0;i<iters.length;i++) {
            idexes.push(0);
        }
        var ret = [];
        var at = 0;
        iters[0] = _.foriter(ibles[0]);
        while (at >= 0) {
            if (!iters[at].trynext()) {
                at -= 1;
            } else if (ifs[at] && !ifs[at](iters[at].value)) {
                continue;
            } else if (at < idexes.length-1) {
                at++;
                iters[at] = _.foriter(ibles[at]);
            } else {
                var args = [];
                for (var i = 0; i < iters.length; i++) {
                    args.push(iters[i].value);
                }
                ret.push(func.apply(null, args));
            }
        }
        return _.list(ret);
    });

    _.gencomp = Class('genexpr', [], {
        __init__: $def(function __init__(self, ibles, func, ifs) { // 1999 :builtin:
            self.idexes = [];
            self.ibles = ibles;
            self.func = func;
            self.ifs = ifs;

            if (self.ibles.as_js) self.ibles = self.ibles.as_js();
            self.iters = [];
            for (var i = 0; i < self.ibles.length; i++) {
                self.iters.push(null);
            }
            if (self.ifs.as_js) self.ifs = self.ifs.as_js();
            for (var i = 0; i < self.iters.length; i++) {
                self.idexes.push(0);
            }
            self.ret = [];
            self.at = 0;
            self.iters[0] = _.foriter(self.ibles[0]);
        }),
        __iter__: $def(function __iter__(self) { // 2018 :builtin:
            return self;
        }),
        next: $def(function next(self) { // 2021 :builtin:
            while (self.at >= 0) {
                if (!self.iters[self.at].trynext()) {
                    self.at -= 1;
                } else if (self.ifs[self.at] && !self.ifs[self.at](self.iters[self.at].value)) {
                    continue;
                } else if (self.at < self.idexes.length-1) {
                    self.at++;
                    self.iters[self.at] = _.foriter(self.ibles[self.at]);
                } else {
                    var args = [];
                    for (var i = 0; i < self.iters.length; i++) {
                        args.push(self.iters[i].value);
                    }
                    return self.func.apply(null, args);
                }
            }
            _.raise(_.StopIteration);
        }),
        send: __not_implemented__('genexpr.send'),
        throw_: __not_implemented__('genexpr.throw_')
    });
    _.iter = $def({'sentinel':null}, function iter(ible, sentinel) { // 2043 :builtin:
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
        __init__: $def(function(self, ible){ // 2066 :builtin:
            self.iter = _.iter(ible);
            self.value = null;
        }),
        trynext: $def(function(self){ // 2070 :builtin:
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
    _.vars = $def(function vars(obj) { // 2085 :builtin:
        // TODO::: this isn't good
        var dct = {};
        for (var a in obj) {
            dct[a] = obj[a];
        }
        return dct;
    });

    /** inheritence **/

    _.type = $def(function (what) { // 2096 :builtin:
        if (what === null) {
            return null;
        }
        if (typeof(what) === 'number')
            return _._int;
        if (what.__class__ !== undefined)
            return what.__class__;
        if (what.__type__ !== undefined)
            return what.__type__;
        return _.str(typeof(what));
    });
    _.classmethod = classmethod;
    _.staticmethod = staticmethod;

    _.isinstance = $def(function isinstance(inst, clsses) { // 2111 :builtin:
        if (inst === null || !defined(inst.__class__))
            return false;
            // _.raise("PJs Error: isinstance only works on objects");
        return _.issubclass(inst.__class__, clsses);
    });

    _.issubclass = $def(function issubclass(cls, clsses) { // 2118 :builtin:
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
    _.round = $def(function round(what) { // 2146 :builtin:
        what = _.js(what);
        if (typeof(what) !== 'number')
          _.raise(_.TypeError('round() requires a number'));
        return _._float(Math.round(what));
    });
    _.dir = __not_implemented__("dir");
    _.cmp = __not_implemented__("cmp");
    _.set = __not_implemented__("set");
    _.bytes = __not_implemented__("bytes");
    _.reduce = $def({}, true, function reduce(func, seq, more) { // 2156 :builtin:
        var ml = more.as_js().length;
        if (ml > 1) {
            _.raise(_.TypeError('built-in function reduce takes a max of 3 arguments (' + (2 + ml) + ' given)'));
        }
        var running;
        var iter = _.foriter(seq);
        if (ml == 1) {
            running = more.__getitem__(0);
        } else if (iter.trynext()) {
            running = iter.value;
        } else {
            _.raise(_.TypeError('reduce() of empty sequence with no initial value'));
        }
        while (iter.trynext()) {
            running = func(running, iter.value);
        }
        return running;
    });
    _.sum = $def({'start':0}, function (seq, start) { // 2175 :builtin:
        var iter = _.foriter(seq);
        while (iter.trynext()) {
            start = _.add(start, iter.value);
        }
        return start;
    });
    _.intern = __not_implemented__("intern");
    _.Ellipsis = __not_implemented__("Ellipsis");
    _.locals = __not_implemented__("locals");
    _.getattr = __not_implemented__("getattr");
    _.abs = __not_implemented__("abs");
    _.exit = __not_implemented__("exit");
    _.print = $def({}, true, function _print(args) { // 2188 :builtin:
        var strs = [];
        for (var i=0;i<args._list.length;i++) {
            if (typeof(args._list[i]) === 'string')
                strs.push(":'" + args._list[i] + "':");
            strs.push(_.str(args._list[i]));
        }
        console.log(strs.join(' '));
    });
    _.print.__name__ = 'print';
    _.assert = $def(function assert(bool, text) { // 2198 :builtin:
        if (!bool) {
            _.raise(_.AssertionError(text));
        }
    });
    _._debug_stack = [];
    _.raise = $def(function raise(obj) { // 2204 :builtin:
        if (obj.__type__ === 'type') {
            obj = obj();
        }
        obj.stack = _._debug_stack.slice();
        throw obj;
    });
    _.True = true;
    _.False = false;
    _.None = null;
    _.len = $def(function len(obj) { // 2214 :builtin:
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
    _.filter = $def(function filter(func, seq) { // 2225 :builtin:
        if (func === _.None) {
            func = _.bool;
        }
        var itype = _.type(seq);
        var res = [];
        var iter = _.foriter(seq);
        while (iter.trynext()) {
            if (func(iter.value)) {
                res.push(iter.value);
            }
        }
        if (itype === _.str) {
            return _.str('').join(_.list(res));
        } else if (itype === _.tuple) {
            return _.tuple(res);
        } else {
            return _.list(res);
        }
    });
            
    _.range = $def({'end':null, 'step':1}, function range(start, end, step) { // 2246 :builtin:
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
    _.pow = $def(function pow(a, b) { // 2257 :builtin:
        return Math.pow(_.js(a), _.js(b));
    });
    _.globals = __not_implemented__("globals");
    _.divmod = __not_implemented__("divmod");
    _.enumerate = __not_implemented__("enumerate");
    _.apply = __not_implemented__("apply");
    _.open = __not_implemented__("open");
    _.quit = __not_implemented__("quit");
    _.zip = $def({}, true, function (first, more) { // 2266 :builtin:
        var sequences = [first].concat(more.as_js());
        var iters = [];
        for (var i = 0; i < sequences.length; i++) {
            iters.push(_.foriter(sequences[i]));
        }
        var result = [];
        while (true) {
            var done = false;
            var val = [];
            for (var i=0; i < iters.length; i++) {
                if (iters[i].trynext()) {
                    val.push(iters[i].value);
                } else {
                    done = true;
                    break;
                }
            }
            if (done) {
                break;
            }
            result.push(val);
        }
        return _.list(result);
    });
    _.hex = __not_implemented__("hex");
    _.next = __not_implemented__("next");
    _.chr = __not_implemented__("chr");
    // dirty hack
    _.xrange = Class('xrange', [], {
        __init__: $def({'end':null, 'step':1}, function __init__(self, start, end, step) { // 2296 :builtin:
            if (end === null) {
                end = start;
                start = 0;
            }
            self.start = start;
            self.end = end;
            self.step = step;
        }),
        __iter__: $def(function __iter__(self) { // 2305 :builtin:
            return _.rangeiterator(self);
        })
    });
    _.rangeiterator = Class('rangeiterator', [], {
        __init__: $def(function __init__(self, range) { // 2310 :builtin:
            self.range = range;
            self.at = range.start;
            self.started = false;
        }),
        __iter__: $def(function __iter__(self) { // 2315 :builtin:
            return self;
        }),
        next: $def(function next(self) { // 2318 :builtin:
            if (!self.started) {
                self.started = true;
                return self.at;
            } else {
                self.at += self.range.step
                if (self.at >= self.range.end) {
                    _.raise(_.StopIteration);
                }
                return self.at;
            }
        })
    });

    _.reversed = __not_implemented__("reversed");
    _.hasattr = __not_implemented__("hasattr");
    _.delattr = __not_implemented__("delattr");
    _.setattr = __not_implemented__("setattr");
    _.raw_input = __not_implemented__("raw_input");
    _.compile = __not_implemented__("compile");

    _.repr = $def(function repr(item) { // 2339 :builtin:
        if (item === null)
            return _.str('None');
        if (typeof(item) === 'string') {
            return ':' + _.str("'" + item + "'") + ':';
        } else if (typeof(item) === 'number') {
            return _.str('' + item);
        } else if (defined(item.__repr__) && (item.__repr__.__type__ !== instancemethod || item.__repr__.im_self)) {
            return item.__repr__();
        } else return _.str(item);
    });

    _.property = __not_implemented__("property");
    _.GeneratorExit = __not_implemented__("GeneratorExit");
    _.coerce = __not_implemented__("coerce");
    _.file = __not_implemented__("file");
    _.unichr = __not_implemented__("unichr");
    _.id = __not_implemented__("id");
    _.min = $def({}, true, function(args) { // 2357 :builtin:
        if (_.len(args) === 1)
            args = _.list(args.__getitem__(0));
        args = args.as_js();
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
        __str__:$def(function(self){return _.str('NotImplemented');})
    })());
    _.map = $def({}, true, function map(func, sequences) { // 2373 :builtin:
        if (func === null) {
            _.raise(_.NotImplementedError('Not yet implemented -- map(None, ...)'));
        }
        sequences = sequences.as_js();
        var iters = [];
        for (var i = 0; i < sequences.length; i++) {
            iters.push(_.foriter(sequences[i]));
        }
        var result = [];
        while (true) {
            var done = true;
            var val = [];
            for (var i=0; i < iters.length; i++) {
                if (iters[i].trynext()) {
                    val.push(iters[i].value);
                    done = false;
                } else {
                    val.push(null);
                }
            }
            if (done) {
                break;
            }
            result.push(func.args(_.list(val), _.dict()));
        }
        return _.list(result);
    });
    _.buffer = __not_implemented__("buffer");
    _.max = $def({}, true, function(args) { // 2402 :builtin:
        if (_.len(args) === 1)
            args = _.list(args.__getitem__(0));
        args = args.as_js();
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
        __init__: $def({}, true, function __init__(self, args) { // 2418 :builtin:
            self.args = args;
        }),
        __str__: $def(function __str__(self) { // 2421 :builtin:
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

    _.assertdefined = function assertdefined(x, name) { // 2475 :builtin:
        if (x === undefined || x == window[name])
            _.raise(_.NameError('undefined variable "' + name + '"'));
        return x;
    };
    _.output_exception = $def(function (e, stack) { // 2480 :builtin:
        var pf = __builtins__.print;
        // if __builtins__.print is in the stack, don't use it here
        for (var i=0;i<stack.length;i++) {
            if (stack[1] == pf) {
                console.log('using console.log -- error printing pythony');
                pf = console.log;
                break;
            }
        }
        pf(_.str('Traceback (most recent call last)'));
        for (var i=0;i<stack.length;i++){
            var fn = stack[i][1];
            var ost = fn.toString;
            if (fn._to_String)
                fn.toString = fn._old_toString;
            pf(_.str('  '), stack[i][1]);
        }
        if (e.__class__)
            pf(_.str('Python Error:'), e);
        else
            console.log(_.str('Javascript Error:'), e);

     });
    _.run_main = $def({'path':[]}, function(filename, path){ // 2504 :builtin:
        var sys = _.__import__('sys');
        sys.path = _.py(path);
        try {
            return __module_cache[filename].load('__main__');
        } catch (e) {
            var stack = __builtins__._debug_stack;
            _.output_exception(e, stack);
            throw e;
        }
    });

    _.definedor = function (what, or) { // 2516 :builtin:
      if (!defined(what)) return or;
      return what;
    };
});

__module_cache['<builtin>/sys.py'].load('sys'); // must be loaded for importing to work.
__module_cache['<builtin>/os/path.py'].load('os.path');
var __builtins__ = __module_cache['<builtin>/__builtin__.py'].load('__builtin__');
var __import__ = __builtins__.__import__; // should I make this global?
var $b = __builtins__;

