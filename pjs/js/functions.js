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
var fnrx = /function\s+\w*\s*\(([\w,\s]*)\)/;

function defined(x){
    return typeof(x) != 'undefined';
}

String.prototype.strip = function(){
    return this.replace(/^\s+/,'').replace(/\s+$/,'');
};

function get_fn_args(func) {
    var match = (func + '').match(fnrx);
    if (!match)
        throw "ParseError: sorry, something went wrong on my end; are you sure you're passing me a valid function?" + (fn+'');
    var args = match[1].split(',');
    for (var i=0;i<args.length;i++) {
        args[i] = args[i].replace(/^\s+/,'').replace(/\s+$/,'');
    }
    if (args.length !== func.length)
        throw "ParseError: didn't parse the right number of arguments";
    return args;
}
    

function check_defaults(func_args, defaults) {
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
    if (typeof(func) !== 'function')
        throw new Error("JS Error: $m requires a function as the last argument");
    var func_args = get_fn_args(func);
    func.__args__ = func_args;
    var defaults = args.length?args.shift():{};
    var aflag = args.length?args.shift();false;
    var kflag = args.length?args.shift();false;
    if (args.length) throw new Error("JS Error: $m takes at most 4 arguments. (" + (4+args.length) + " given)");

    var argnum = func_args.length;
    if (aflag) argnum--;
    if (kflag) argnum--;

    if (!check_defaults(func_args, defaults))
        throw new Error("SyntaxError in function " + fn.name + ": non-default argument follows default argument");

    var ndefaults = 0;
    for (var x in defaults) ndefaults++;

    var meta = [];
    // can probably condense these
    if (aflag) {
        meta = function() {
            var args = to_array(arguments);
            var therest = [];
            if (args.length > argnum) {
                // TODO: probably use __builtins__.list here
                therest = args.slice(argnum);
                args = args.slice(0, argnum);
                args.push(therest);
            } else {
                for (var i=args.length; i<argnum; i++) {
                    if (!defined(defaults[func_args[i]]))
                        // TODO: use __builtin__.Exception
                        throw new Error("TypeError: " + func.name + "() takes at least " + (argnum-ndefaults) +" arguments (" + args.length + " given)");
                    args.push(defaults[func_args[i]]);
                }
                // TODO: list here again
                args.push([]);
            }
            if (kflag)
                // TODO: use _$$_.dict()
                args.push({});
            return func.apply(null, args);
        };
    } else {
        meta = function() {
            var args = to_array(arguments);
            if (args.length > argnum)
                throw new Error("TypeError: " + func.name + "() takes at most " + (argnum) + " arguments (" + args.length + " given)');
            for (var i=args.length; i<argnum; i++) {
                if (!defined(defaults[func_args[i]]))
                    // TODO: use __builtin__.Exception
                    throw new Error("TypeError: " + func.name + "() takes at least " + (argnum-ndefaults) +" arguments (" + args.length + " given)");
                args.push(defaults[func_args[i]]);
            }
            if (kflag)
                // TODO: use _$$_.dict()
                args.push({});
            return func.apply(null, args);
        };
    }

    meta.args = function(args, dict) {
        // convert args, dict to types
        if (args.length > argnum) {
            if (!aflag)
                throw new Error("TypeError: " + func.name + "() takes at most " + argnum + ' arnuments (' + args.length + ' given)');
            therest = args.slice(argnum);
            args = args.slice(0, argnum);
            args.push(therest);
        } else {
            for (var i=args.length;i<argnum;i++) {
                var aname = func_args[i];
                if (defined(dict[aname])) {
                    // TODO: treat as actual dictionary
                    args.push(dict[aname]);
                    delete dict[aname];
                } else if (defined(defaults[aname]))
                    args.push(defaults[aname]);
                else
                    throw new Error('TypeError: ' + func.name + '() takes at least ' + argnum-ndefaults + ' non-keyword arguments');
            }
            if (aflag)
                // TODO: use list here
                args.push([]);
        }
        if (kargs)
            args.push(dict);
        else if (dict)
            throw new Error("TypeError: " + func.name + '() got unexpected keyword arguments');
        return func.apply(null, args);
    };
    meta.__wraps__ = func;
    meta.name = func.name;
    meta.__name__ = func.name;
    meta.args.__wraps__ = func;
    meta.args.name = func.name;
    meta.args.__name__ = func.name;
    return meta;
}

/**
    if (fn.__type__)
        meta.__type__ = fn.__type__;
    else
        meta.__type__ = 'method';
    meta.__wraps__ = fn;
    meta.name = fn.name;
    meta.__name__ = fn.name;
    return meta;
}
**/

/** end python function madness **/
// vim: sw=4 sts=4
//
//
/** deleted stuff
 *

function $m() {
    var args = to_array(arguments);
    if (!args.length) {
        throw "$m requires at least one argument...";
    }
    var fn = args.pop();
    if (typeof(fn)!=='function')
        throw "ParseError: $m requires a function as the last argument";

    var match = (fn+'').match(fnrx);
    if (!match)
        throw "ParseError: sorry, something went wrong on my end; are you sure you're passing me a valid function?" + (fn+'');
    fn.__args__ = match[1].split(',');
    if (fn.__args__.length == 1 && !fn.__args__[0].strip())
        fn.__args__ = [];
    for (var i=0;i<fn.__args__.length;i++){
        fn.__args__[i] = fn.__args__[i].strip();
    }
    if (fn.__args__.length != fn.length)
        throw "ParseError: sorry, something went wrong on my end; are you sure you're passing me a valid function? (arg nums didn't line up "+fn.__args__+' '+fn.length+")" + fn;

    var defaults = args.length?args.shift():{};
    if (defaults === false) { // no args checking...? what?
        return fn;
    }
    var fargs = args.length?args.shift():false;
    var fkwargs = args.length?args.shift():false;

    if (args.length)
        throw "$m takes a max of 4 arguments";

    var argnum = fn.__args__.length;
    if (fargs) argnum-=1;
    if (fkwargs) argnum-=1;

    var dflag = false;
    for (var i=0;i<argnum;i++) {
        if (defined(defaults[fn.__args__[i]])) dflag = true;
        else if (dflag) {
            throw "SyntaxError in function " + fn.name + ": non-default argument follows default argument";
        }
    }

    var meta = function() {
        var args = to_array(arguments);
        var catchall = [];
        var catchdct = {};
        if (args.length > argnum) {
            if (fargs) {
                catchall = args.slice(argnum);
                args = args.slice(0, argnum);
            } else
                throw "TypeError: " + fn.name + "() takes "+argnum+" arguments (" + args.length + " given)";
        } else {
            for (var i=args.length;i<argnum; i++){
                if (!defined(defaults[fn.__args__[i]])) {
                    throw "TypeError: " + fn.name + "() takes at least " + (argnum-ndefaults) +" arguments (" + args.length + " given)";
                }
                args.push(defaults[fn.__args__[i]]);
            }
        }
        if (fargs) args.push(catchall);
        if (fkwargs) args.push(catchdct);
        return fn.apply(null, args);
    };
**/
