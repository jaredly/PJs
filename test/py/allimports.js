
load("./build/pjslib.js");
module('/home/jared/clone/pjs/test/py/allimports.py', function (_) {
    _.__doc__ = "";
    var __pjs_tmp_module = __builtins__.__import__("os.path", _.__name__, _.__file__);
    _.jon = __pjs_tmp_module.join;
    _.dirname = __pjs_tmp_module.dirname;
    __builtins__.print(_.jon('hi', 'ho'));//, true
    var __pjs_tmp_module = __builtins__.__import__("os.path", _.__name__, _.__file__);
    if (__pjs_tmp_module.__all__ === undefined) {
        for (var __pjs_k in __pjs_tmp_module) {
            if (__pjs_k.indexOf('__') !== 0)
                eval('_.'+__pjs_k+' = __pjs_tmp_module.'+__pjs_k+';');
        }
        delete __pjs_k;
    } else {
        var __pjs_a = __pjs_tmp_module.__all__.as_js();
        for (var __pjs_i=0; __pjs_i<__pjs_a.length; __pjs_i++) {
            var __pjs_k = __pjs_a[__pjs_i];
            eval('_.'+__pjs_k+' = __pjs_tmp_module.'+__pjs_k+';');
        }
        delete __pjs_a;
        delete __pjs_i;
        delete __pjs_k;
    }
    var __pjs_tmp_module = __builtins__.__import__("toimp", _.__name__, _.__file__);
    if (__pjs_tmp_module.__all__ === undefined) {
        for (var __pjs_k in __pjs_tmp_module) {
            if (__pjs_k.indexOf('__') !== 0)
                eval('_.'+__pjs_k+' = __pjs_tmp_module.'+__pjs_k+';');
        }
        delete __pjs_k;
    } else {
        var __pjs_a = __pjs_tmp_module.__all__.as_js();
        for (var __pjs_i=0; __pjs_i<__pjs_a.length; __pjs_i++) {
            var __pjs_k = __pjs_a[__pjs_i];
            eval('_.'+__pjs_k+' = __pjs_tmp_module.'+__pjs_k+';');
        }
        delete __pjs_a;
        delete __pjs_i;
        delete __pjs_k;
    }
    __builtins__.print(_.thevalue);//, true
    __builtins__.print(_.dirname(_.example.__file__));//, true
});


module('/home/jared/clone/pjs/test/py/example.py', function (_) {
    _.__doc__ = 'here\'s a docstring for this module\n' +
'and it\'s multi-line';
    'here\'s a docstring for this module\n' +
    'and it\'s multi-line';
    _.toimp = __builtins__.__import__("toimp", _.__name__, _.__file__);
    _.toimp = __builtins__.__import__("toimp", _.__name__, _.__file__);
    __builtins__.print('example');//, true
    _.a = 'hi';
    _.b = 'ho';
    _.a = 'hp';
    _.h = 4;
    _.man = 1 + 2;
    _.man = __builtins__.tuple([1 + 2, __builtins__.list(['a', 'list']), __builtins__.dict([['a', 'dict' + ' yeah'], [3, 4]])]);
    try {
        _.um;
        3 + 4 + __builtins__.list([3]);
        _.a.b();
    } catch (__pjs_err) {
        if (__pjs_err.__class__ && __builtins__.isinstance(__pjs_err, __builtins__.TypeError)) {
            _.e = __pjs_err;
            __builtins__.print('yeah');//, true
        } else if (__pjs_err.__class__ && __builtins__.isinstance(__pjs_err, __builtins__.tuple([__builtins__.NotImplemented, __builtins__.ValueError]))) {
            _.r = __pjs_err;
            __builtins__.print('and', _.r);//, true
        } else {
            __builtins__.print('failed');//, true
        }
    }
    __builtins__.print(_.man);//, true
    _.foo = $m({'c': 3}, true, function foo(a, b, c, rest) {
        __builtins__.print(a + b, c);//, true
        c = 5;
        var sub = $m(function sub() {
            __builtins__.print('just to test');//, true
        });
        sub.__module__ = _.__name__;
        var d = 3;
        sub();
        return 17;
    });
    _.foo.__module__ = _.__name__;
    _.bar = $m({}, false, true, function bar(r, man) {
        __builtins__.print(man);//, true
        __builtins__.print(r);//, true
    });
    _.bar.__module__ = _.__name__;
    _.decorate_me = $m(function decorate_me(func) {
        __builtins__.print('decorating', func.__name__);//, true
        var meta = $m({}, true, true, function meta(a, b) {
            __builtins__.print('deca_args', a, b);//, true
            func.args(a, b);
        });
        meta.__module__ = _.__name__;
        return meta;
    });
    _.decorate_me.__module__ = _.__name__;
    _.Bar = Class('Bar', [], (function(){
        var __ = {};
        __.cattr = 'something';
        __.__init__ = $m(function __init__(self, a, b) {
            __builtins__.print('args', a, b);//, true
        });
        __.__init__.__module__ = _.__name__;
        __.staticm = __builtins__.staticmethod($m({}, true, function staticm(one, alls) {
            __builtins__.print('from static', one, alls);//, true
        }));
        __.staticm.__module__ = _.__name__;
        __.bar = $m({}, false, true, function bar(self, baz) {
            __builtins__.print('bar_bar', baz);//, true
        });
        __.bar.__module__ = _.__name__;
        __.__str__ = $m(function __str__(self) {
            return '<Bar inst>';
        });
        __.__str__.__module__ = _.__name__;
        __.__repr__ = $m(function __repr__(self) {
            return __builtins__.str(self);
        });
        __.__repr__.__module__ = _.__name__;
        __.bar = _.decorate_me(__.bar);
        return __;
    }()));
    _.Bar.__module__ = _.__name__;
    __builtins__.assert(__builtins__.True, 'something' + 'other thing');
    __builtins__.list([3, 4, 5]);
    __builtins__.print('loaded stuff');//, true
    __builtins__.print(_.__name__);//, true
    if (_.__name__ === '__main__') {
        _.Bar(3, 4).bar.args(__builtins__.tuple([]), {'a': 5, 'c': 'hoo'});
        _.Bar.staticm(5, 6, 7, 'i');
    } else {
        _.a = 2;
        _.foo(1, 2, 3, 4, 5, 6);
        _.bar.args(__builtins__.tuple([]), {'r': 5, 't': 'man'});
        __builtins__.print('notmain');//, true
    }
});


module('/home/jared/clone/pjs/test/py/toimp.py', function (_) {
    _.__doc__ = 'this is a module to bge imported';
    'this is a module to bge imported';
    _.thevalue = 20;
    _.example = __builtins__.__import__("example", _.__name__, _.__file__);
    __builtins__.print(_.__name__);//, true
});



try {
    __module_cache['/home/jared/clone/pjs/test/py/allimports.py'].load('__main__');
} catch (e) {
    var stack = __builtins__._debug_stack;
    var pf = __builtins__.print;
    // if __builtins__.print is in the stack, don't use it here
    for (var i=0;i<stack.length;i++) {
        if (stack[1] == pf) {
            print('using rhino\'s print -- error printing pythony');
            pf = print;
            break;
        }
    }
    pf('Traceback (most recent call last)');
    for (var i=0;i<stack.length;i++){
        var fn = stack[i][1];
        var ost = fn.toString;
        if (fn._to_String)
            fn.toString = fn._old_toString;
        pf('  ', stack[i][0]);
    }
    if (e.__class__)
        pf('Python Error:', e);
    else
        pf('Javascript Error:', e);
}

