/**
This file is part of PJs.

  PJs is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  PJs is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with PJs.  If not, see <http://www.gnu.org/licenses/>.

Copyright 2010 Jared Forsyth <jared@jareforsyth.com>

**/

/**
Now you can import stuff...just like in python.
**/

var __not_implemented__ = function(name) {
    return function() {
        throw "NotImplemented: the builtin function "+name+" is not implemented yet. You should help out and add it =)";
    };
};

module('<builtin>/sys.py', function (__globals__) {
    __globals__.__doc__ = "The PJs module responsible for system stuff";
    __globals__.modules = {}; // sys and __builtin__ won't be listed
                             // it doesn't make sense for them to be
                             // reloadable.
    __globals__.path = ['.', '<builtin>'];
    __globals__.exit = $m({'code':0}, function exit(code) {
        throw "SystemExit: sys.exit() was called with code "+code;
    });
});

module('<builtin>/os/path.py', function(__globals__) {
    __globals__.__doc__ = "a module for dealing with paths";
    __globals__.join = $m({}, true, function(first, args) {
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
    __globals__.isabs = $m(function(path) {
        return path && path[0] == '/';
    });
    __globals__.abspath = $m(function(path) {
        if (!__globals__.isabs(path))
            throw "not implementing this atm";
        return __globals__.normpath(path);
    });
    __globals__.dirname = $m(function(path) {
        return path.split('/').slice(0,-1).join('/');
    });
    __globals__.basename = $m(function(path) {
        return path.split('/').slice(-1)[0];
    });
    __globals__.normpath = $m(function(path) {
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

module('<builtin>/__builtin__.py', function (__globals__) {

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
            var dname = path.normpath(path.join(path.dirname(file), sys.path[i]));
            var fname = path.join(dname, name.replace('.', '/')+'.py');
            if (defined(__module_cache[fname])) {
                foundat = fname;
                break;
            }
        }
        if (!foundat)
            throw "ImportError: no module named "+name;
        if (relflag) {
            mname = [from.split('.').slice(0,-1)].concat([name]).join('.');
            if (mname[0] == '.')mname = mname.slice(1);
        } else
            mname = name;

        if (!defined(sys.modules[mname])) {
            sys.modules[mname] = {}
            __module_cache[foundat].load(mname, sys.modules[mname]);
        }
        return sys.modules[mname];
    });
    __globals__.reload = $m(function(module) {
        delete sys.modules[module.__name__];
        return __globals__.__import__(module);
    });
    
    __globals__.unicode = __not_implemented__("unicode");
    __globals__.bytearray = __not_implemented__("bytearray");
    __globals__.all = __not_implemented__("all");
    __globals__.help = __not_implemented__("help");

    __globals__.vars = $m(function(obj) {
        var dct = {};
        for (var a in obj) {
            dct[a] = obj[a];
        }
        return dct;
    });
    __globals__.isinstance = $m(function(inst, clsses) {
        if (!defined(inst.__class__))
            throw "PJs Error: isisntance only works on objects";
        return __globals__.issublass(inst.__class__, clsses);
    });
    __globals__.issubclass = $m(function(cls, clsses) {
        if (!defined(inst.__bases__))
            throw "PJs Error: issubclass only works on classes";
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
    __globals__.copyright = 'something should go here...';

    __globals__.dict = __not_implemented__("dict");
    __globals__.input = __not_implemented__("input");
    __globals__.oct = __not_implemented__("oct");
    __globals__.bin = __not_implemented__("bin");
    __globals__.SystemExit = __not_implemented__("SystemExit");
    __globals__.format = __not_implemented__("format");
    __globals__.sorted = __not_implemented__("sorted");
    __globals__.False = __not_implemented__("False");
    __globals__.list = $m(function(ible) {
        if (defined(ible.__iter__)) {
            var t = [];
            var i = ible.__iter__();
            while (true) {
                try {
                    t.push(i.next());
                } catch (e) {
                    if (__globals__.isinstance(e, __globals__.StopIteration)) {
                        break;
                    }
                    throw e;
                }
            }
        } else if (ible instanceof Array) {
            var t = [];
            for (var i=0;i<ible.length;i++) {
                t.push(ible[i]);
            }
        }
        return t;
    });
    __globals__.iter = $m(function(ible) {
        if (!defined(ible.__iter__))
            throw 'item not iterable';
        return ible.__iter__();
    });
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
    __globals__.print = $m({}, true, function(args) {
        var strs = [];
        for (var i=0;i<args.length-1;i++) {
            strs.push(__globals__.str(args[i]));
        }
        print(strs.join(' '));
    });
    __globals__.assert = $m(function(bool, text) {
        if (!bool) {
            throw Error(text);
        }
    });
    // __globals__.raise = $m(
    __globals__.True = __not_implemented__("True");
    __globals__.None = __not_implemented__("None");
    __globals__.hash = __not_implemented__("hash");
    __globals__.len = __not_implemented__("len");
    __globals__.credits = __not_implemented__("credits");
    __globals__.frozenset = __not_implemented__("frozenset");
    __globals__.ord = __not_implemented__("ord");
    // __globals__.super = __not_implemented__("super");
    __globals__.license = __not_implemented__("license");
    __globals__.KeyboardInterrupt = __not_implemented__("KeyboardInterrupt");
    __globals__.filter = __not_implemented__("filter");
    __globals__.range = __not_implemented__("range");
    __globals__.BaseException = __not_implemented__("BaseException");
    __globals__.pow = __not_implemented__("pow");
    // __globals__.float = __not_implemented__("float");
    __globals__.globals = __not_implemented__("globals");
    __globals__.divmod = __not_implemented__("divmod");
    __globals__.enumerate = __not_implemented__("enumerate");
    __globals__.apply = __not_implemented__("apply");
    __globals__.open = __not_implemented__("open");
    __globals__.quit = __not_implemented__("quit");
    __globals__.basestring = __not_implemented__("basestring");
    __globals__.zip = __not_implemented__("zip");
    __globals__.hex = __not_implemented__("hex");
    // __globals__.long = __not_implemented__("long");
    __globals__.next = __not_implemented__("next");
    __globals__.chr = __not_implemented__("chr");
    __globals__.xrange = __not_implemented__("xrange");

    /** here's where the class magic happens **/
    __globals__.type = type;
    __globals__.classmethod = classmethod;
    __globals__.staticmethod = staticmethod;

    __globals__.tuple = Class('tuple', [], {
        __init__: $m(function(self, ible) {
              var ible = ible.slice();
              self.__len__ = function(){return ible.length;};
              for (var i=0;i<len;i++){
                  (function(i){
                  self.__defineGetter__(i, function(){return ible[i];})
                  }(i));
              }
        }),
        count: $m(function(self, item) {
              var num = 0;
              for (var i=0;i<__globals__.len(self);i++) {
                  if (self[i] == item)
                      num ++;
              }
              return num;
        }),
        index: $m(function(self, index) {
              for (var i=0;i<__globals__.len(self);i++) {
                  if (self[i] == item)
                      return i;
              }
              return -1;
        }),
    });
    __globals__.reversed = __not_implemented__("reversed");
    __globals__.hasattr = __not_implemented__("hasattr");
    __globals__.delattr = __not_implemented__("delattr");
    __globals__.setattr = __not_implemented__("setattr");
    __globals__.raw_input = __not_implemented__("raw_input");
    __globals__.compile = __not_implemented__("compile");
    __globals__.str = $m(function(item) {
        if (defined(item.__str__)) {
            return item.__str__();
        } else if (item instanceof Array) {
            var m = [];
            for (var i=0;i<item.length;i++) {
                m.push(__globals__.repr(item[i]));
            }
            return '['+m.join(', ')+']';
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
    __globals__.repr = $m(function(item) {
        if (typeof(item) === 'string') {
            return "'" + item + "'";
        } else if (defined(item.__repr__)) {
            return item.__repr__();
        } else return __globals__.str(item);
    });
    __globals__.property = __not_implemented__("property");
    __globals__.GeneratorExit = __not_implemented__("GeneratorExit");
    // __globals__.int = __not_implemented__("int");
    __globals__.coerce = __not_implemented__("coerce");
    __globals__.file = __not_implemented__("file");
    __globals__.unichr = __not_implemented__("unichr");
    __globals__.id = __not_implemented__("id");
    __globals__.min = __not_implemented__("min");
    __globals__.execfile = __not_implemented__("execfile");
    __globals__.any = __not_implemented__("any");
    __globals__.complex = __not_implemented__("complex");
    __globals__.bool = __not_implemented__("bool");
    __globals__.NotImplemented = __not_implemented__("NotImplemented");
    __globals__.map = __not_implemented__("map");
    __globals__.buffer = __not_implemented__("buffer");
    __globals__.max = __not_implemented__("max");
    __globals__.object = __not_implemented__("object");
    __globals__.callable = __not_implemented__("callable");
    __globals__.eval = __not_implemented__("eval");
    __globals__.__debug__ = __not_implemented__("__debug__");
});

__module_cache['<builtin>/sys.py'].load('sys'); // must be loaded for importing to work.
__module_cache['<builtin>/os/path.py'].load('os.path');
var __builtins__ = __module_cache['<builtin>/__builtin__.py'].load('__builtin__');
var __import__ = __builtins__.__import__; // should I make this global?

