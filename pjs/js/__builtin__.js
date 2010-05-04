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

module(function sys(__module__) {
    __module__.__doc__ = "The PJs module responsible for system stuff";
    __module__.modules = {}; // sys and __builtin__ won't be listed
                             // it doesn't make sense for them to be
                             // reloadable.
    __module__.exit = $m({'code':0}, function exit(code) {
        throw "SystemExit: sys.exit() was called with code "+code;
    });
});

module(function __builtin__(__module__) {

    var sys = __module_cache['sys']._module;

    __module__.__doc__ = 'Javascript corrospondences to python builtin functions';

    /** importing modules **/
    __module__.__import__ = $m(function __import__(name) {
        if (!defined(__module_cache[name])) {
            throw "ImportError: no module named "+name;
        }
        if (!defined(sys.modules[name]))
            sys.modules[name] = __module_cache[name].load();
        return sys.modules[name];
    });
    __module__.reload = $m(function(module) {
        delete sys.modules[module.__name__];
        return __module__.__import__(module)l
    };
    
    __module__.unicode = __not_implemented__("unicode");
    __module__.bytearray = __not_implemented__("bytearray");
    __module__.all = __not_implemented__("all");
    __module__.help = __not_implemented__("help");

    __module__.vars = $m(function(obj) {
        var dct = {};
        for (var a in obj) {
            dct[a] = obj[a];
        }
        return dct;
    });
    __module__.isinstance = $m(function(inst, clsses) {
        if (!defined(inst.__class__))
            throw "PJs Error: isisntance only works on objects";
        return __module__.issublass(inst.__class__, clsses);
    });
    __module__.issubclass = $m(function(cls, clsses) {
        if (!defined(inst.__bases__))
            throw "PJs Error: issubclass only works on classes";
        if (!(clsses instanceof Array))
            clsses = [clsses];
        for (var i=0;i<clsses.length;i++) {
            if (cls === clsses[i]) return true;
            for (var a=0;a<cls.__bases__.length;a++) {
                if (__module__.issubclass(cls.__bases__[a], clsses))
                    return true;
            }
        }
        return false;
    });
    __module__.copyright = 'something should go here...';

    __module__.dict = __not_implemented__("dict");
    __module__.input = __not_implemented__("input");
    __module__.oct = __not_implemented__("oct");
    __module__.bin = __not_implemented__("bin");
    __module__.SystemExit = __not_implemented__("SystemExit");
    __module__.format = __not_implemented__("format");
    __module__.repr = __not_implemented__("repr");
    __module__.sorted = __not_implemented__("sorted");
    __module__.False = __not_implemented__("False");
    __module__.list = __not_implemented__("list");
    __module__.iter = __not_implemented__("iter");
    __module__.__package__ = __not_implemented__("__package__");
    __module__.round = __not_implemented__("round");
    __module__.dir = __not_implemented__("dir");
    __module__.cmp = __not_implemented__("cmp");
    __module__.set = __not_implemented__("set");
    __module__.bytes = __not_implemented__("bytes");
    __module__.reduce = __not_implemented__("reduce");
    __module__.intern = __not_implemented__("intern");
    __module__.Ellipsis = __not_implemented__("Ellipsis");
    __module__.locals = __not_implemented__("locals");
    __module__.slice = __not_implemented__("slice");
    __module__.sum = __not_implemented__("sum");
    __module__.getattr = __not_implemented__("getattr");
    __module__.abs = __not_implemented__("abs");
    __module__.exit = __not_implemented__("exit");
    __module__.print = __not_implemented__("print");
    __module__.True = __not_implemented__("True");
    __module__.None = __not_implemented__("None");
    __module__.hash = __not_implemented__("hash");
    __module__.len = __not_implemented__("len");
    __module__.credits = __not_implemented__("credits");
    __module__.frozenset = __not_implemented__("frozenset");
    __module__.ord = __not_implemented__("ord");
    __module__.super = __not_implemented__("super");
    __module__.license = __not_implemented__("license");
    __module__.KeyboardInterrupt = __not_implemented__("KeyboardInterrupt");
    __module__.filter = __not_implemented__("filter");
    __module__.range = __not_implemented__("range");
    __module__.BaseException = __not_implemented__("BaseException");
    __module__.pow = __not_implemented__("pow");
    __module__.float = __not_implemented__("float");
    __module__.globals = __not_implemented__("globals");
    __module__.divmod = __not_implemented__("divmod");
    __module__.enumerate = __not_implemented__("enumerate");
    __module__.apply = __not_implemented__("apply");
    __module__.open = __not_implemented__("open");
    __module__.quit = __not_implemented__("quit");
    __module__.basestring = __not_implemented__("basestring");
    __module__.zip = __not_implemented__("zip");
    __module__.hex = __not_implemented__("hex");
    __module__.long = __not_implemented__("long");
    __module__.next = __not_implemented__("next");
    __module__.chr = __not_implemented__("chr");
    __module__.xrange = __not_implemented__("xrange");

    /** here's where the class magic happens **/
    __module__.type = type;
    __module__.classmethod = classmethod;
    __module__.staticmethod = staticmethod;

    __module__.tuple = __not_implemented__("tuple");
    __module__.reversed = __not_implemented__("reversed");
    __module__.hasattr = __not_implemented__("hasattr");
    __module__.delattr = __not_implemented__("delattr");
    __module__.setattr = __not_implemented__("setattr");
    __module__.raw_input = __not_implemented__("raw_input");
    __module__.compile = __not_implemented__("compile");
    __module__.str = __not_implemented__("str");
    __module__.property = __not_implemented__("property");
    __module__.GeneratorExit = __not_implemented__("GeneratorExit");
    __module__.int = __not_implemented__("int");
    __module__.coerce = __not_implemented__("coerce");
    __module__.file = __not_implemented__("file");
    __module__.unichr = __not_implemented__("unichr");
    __module__.id = __not_implemented__("id");
    __module__.min = __not_implemented__("min");
    __module__.execfile = __not_implemented__("execfile");
    __module__.any = __not_implemented__("any");
    __module__.complex = __not_implemented__("complex");
    __module__.bool = __not_implemented__("bool");
    __module__.NotImplemented = __not_implemented__("NotImplemented");
    __module__.map = __not_implemented__("map");
    __module__.buffer = __not_implemented__("buffer");
    __module__.max = __not_implemented__("max");
    __module__.object = __not_implemented__("object");
    __module__.callable = __not_implemented__("callable");
    __module__.eval = __not_implemented__("eval");
    __module__.__debug__ = __not_implemented__("__debug__");
});

__module_cache.sys.load(); // must be loaded for importing to work.
var __builtins__ = __module_cache.__builtin__.load();
var __import__ = __builtins__.__import__; // should I make this global?

