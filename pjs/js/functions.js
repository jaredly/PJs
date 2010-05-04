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
var fnrx = /^function\s+\w+\s*\(([\w,\s]+)\)/;

function defined(x){
    return typeof(x) != 'undefined';
}

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
        throw "ParseError: sorry, something went wrong on my end; are you sure you're passing me a valid function?";
    fn.__args__ = match[1].split(',');
    if (fn.__args__.length != fn.length)
        throw "ParseError: sorry, something went wrong on my end; are you sure you're passing me a valid function?";

    var defaults = args.length?args.shift():{};
    if (defaults === false) { // no args checking...? what?
        return fn;
    }
    var fargs = args.length?args.shift():false;
    var fkwargs = args.length?args.shift():false;

    if (args.length)
        throw "$m takes a max of 4 arguments";

    var dflag = false;
    for (var i=0;i<fn.__args__.length;i++) {
        if (defined(defaults[fn.__args__[i]])) dflag = true;
        else if (dflag) {
            throw "SyntaxError in function " + fn.name + ": non-default argument follows default argument";
        }
    }
    var ndefaults = 0;
    for (var x in defaults) ndefaults++;

    var argnum = fn.__args__.length;
    if (fargs) argnum-=1;
    if (fkwargs) argnum-=1;

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
            for (int i=args.length;i<argnum; i++){
                if (!defined(defaults[fn.__args__[i]])) {
                    throw "TypeError: " + fn.name + "() takes at least " + (argnum-ndefaults) +" arguments (" + args.lenght + " given)";
                }
                args.push(defaults[fn.__args__[i]]);
            }
        }
        if (fargs) args.push(catchall);
        if (fkwargs) args.push(catchdct);
        return fn.apply(null, args);
    };
    meta.args = function(pos, dict) {
        var full = {};
        for (var i=0;i<pos.length && i<argnum;i++) {
            full[name] = pos[i];
        }
        var catchall = pos.slice(i);
        for (;i<argnum;i++) {
            var name = fn.__args__[i];
            if (defined(dict[name])) {
                full[name] = dict[name];
                delete dict[name];
            } else if (defined(defaults[name])) {
                full[name] = defaults[name];
            } else
                throw "TypeError: " + fn.name + " argument " + name + " was not satisfied.";
        }
        if (!fargs && catchall.length)
            throw "TypeError: " + fn.name + "() takes "+argnum+" arguments (" + args.length + " given)";
        if (!fkwargs && dict) {
            for (var a in dict)
                throw "TypeError: " + fn.name + "() got an unexpected keyword argument '" + a + "'";
        }
        if (fargs) args.push(catchall);
        if (fkwargs) args.push(catchdct);
        return fn.apply(null, args);
    };
    if (fn.__type__)
        meta.__type__ = fn.__type__;
    else
        meta.__type__ = 'method';
    meta.__wraps__ = fn;
    return meta;
}

/** end python function madness **/
