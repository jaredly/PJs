function dump(a) {
    if (a instanceof Array) {
        var r = [];
        for (var i=0;i<a.length;i++) {
            r.push(dump(a[i]));
        }
        return '['+r.join(', ')+']';
    } else if (typeof(a) === 'function')
        if (a.name)
            return '<function '+a.name+'>';
        else
            return '<anonymous function>';
    else if (typeof(a) === 'object') {
        var attrs = [];
        for (var k in a) {
            attrs.push("'"+k+"': "+dump(a[k]));
        }
        return '{'+attrs.join(', ')+'}';
    } else if (typeof(a) === 'string')
        return "'"+a+"'";
    else return ''+a;
}


beforeEach(function(){
    this.addMatchers({
        toThrowWith: function(args, errorlike) {
            if (!errorlike)
                errorlike = /./;
            try {
                var result = this.actual.apply(null, args);
                this.message = function(){
                    return this.actual.name + " was supposed to fail with args: " + dump(args);
                }
                return false;
            } catch (e) {
                var err = e.message?e.message:e.msg?e.msg:e+'';
                if (!(err).match(errorlike)) {
                    this.message = function(){
                        return this.actual.name + " got an unexpected error: " + e + "... looked for "+errorlike;
                    }
                    return false;
                }
                this.message = function(){
                    return this.actual.name + " wasn't supposed to fail with args " + dump(args) + ". Exception: " + e;
                };
                return true;
            }
        },
        toReturnGiven: function(all) {
            for (var i=0;i<all.length;i++) {
                if (!(all[i][0] instanceof Array))
                    all[i][0] = [all[i][0]];
                var res = this.actual.apply(null, all[i][0]);
                if (!this.env.equals_(res, all[i][1])) {
                    return false;
                }
            }
            return true;
        },
    });
});

describe('pjs-functions.js', function () {
    describe('invalid-$m-calls', function(){
        it('invalid args', function() {
            expect($m).toThrowWith([]);
            expect($m).not.toThrowWith([function(){}]);
            expect($m).toThrowWith([{},false,false,false,function(){}]);
            expect($m).toThrowWith([{},false]);
        });
        it('functions', function() {
            expect($m).toThrowWith([{'a':1},function(){}], /^ArgumentError/);
            expect($m).toThrowWith([{'a':3},function(c){}], /^ArgumentError/);
            expect($m).toThrowWith([{'a':3},function(a,b){}]);
            expect($m).toThrowWith([{},true,function(){}],/^SyntaxError/);
            expect($m).toThrowWith([{},true,true,function(onlyone){}],/^SyntaxError/);
        });
    });
    describe('arg-checking', function(){
        it('takes no args', function () {
            var noargs = $m(function () {});
            expect(noargs).toThrowWith(['too many args']);
            expect(noargs).not.toThrowWith([]);
        });
        it('takes some regular args', function(){
            var someargs = $m(function (a, b) {
            });
            expect(someargs).toThrowWith(['too few args'], /^TypeError/);
            expect(someargs).not.toThrowWith(['right number','of args']);
            expect(someargs.args).toThrowWith([[1, 2], {'kw':'args'}]);
            expect(someargs.args).not.toThrowWith([['just ', 'positional args'],{}]);
        });
        it('takes default args', function(){
            var dargs = $m({'c':10}, function(a, b, c) {});
            expect(dargs).toThrowWith([2]);
            expect(dargs).toThrowWith([2,3,4,5]);
            expect(dargs).not.toThrowWith([1,2]);
            expect(dargs).not.toThrowWith([1,2,3]);
            expect(dargs.args).toThrowWith([[],{'a':3}]);
            expect(dargs.args).toThrowWith([[8],{'a':3}]);
            expect(dargs.args).toThrowWith([[1],{'c':4}]);
            expect(dargs.args).not.toThrowWith([[2],{'b':5}])
            expect(dargs.args).not.toThrowWith([[2, 4], {}]);
            expect(dargs.args).not.toThrowWith([[2, 4, 5], {}]);
        });
        it('catches all', function(){
            var cargs = $m({}, true, function(all){});
            expect(cargs).not.toThrowWith([]);
            expect(cargs).not.toThrowWith([1,2,3,4]);
            expect(cargs.args).toThrowWith([], {'some':'kwarg'});
        });
        it('catches kwargs', function(){
            var kargs = $m({}, false, true, function(all){});
            expect(kargs).toThrowWith([1]);
            expect(kargs).not.toThrowWith([]);
            expect(kargs.args).not.toThrowWith([[],{'some':'karg'}]);
        });
        it('everything', function(){
            var every = $m({'c':4}, true, true, function(a, b, c, args, kargs) {});
            expect(every).toThrowWith([]);
            expect(every).not.toThrowWith([1, 2]);
            expect(every).not.toThrowWith([1, 2, 3, 4, 5, 6]);
            expect(every.args).not.toThrowWith([[1,2],{'e':4,'z':'one'}]);
        });
    });
    describe('behavior', function(){
        it('arguments', function(){
            var fn = $m(function(a, b, c){return a+b;});
            expect(fn(1,2,23)).toEqual(3);
        });
        it('defaults', function(){
            var fn = $m({'c':4,'d':2}, function(a,b,c,d){
                return [a+b, c+d];
            });
            expect(fn(1,2)).toEqual([3, 6]);
            expect(fn(1,2,3)).toEqual([3, 5]);
            expect(fn.args([1],{'b':5,'d':12})).toEqual([6, 16]);
        });
        it('catchargs', function(){
            var fn = $m({}, true, function(a, b, c){
                return [a+b, c];
            });
            expect(fn(4,5,6,7,8)).toEqual([9,[6,7,8]]);
            expect(fn(2,3)).toEqual([5,[]]);
        });
        it('naming', function(){
            var fn = $m(function abc(){});
            expect(fn.__name__).toEqual('abc');
        });
    });
});

describe('pjs-classes.js', function(){
    it('general', function(){
        var Abc = Class('Abc', [], {
            __init__:function(self, foo){
                self.foo = foo;
            },
            bar:function(self, one){
                return [self.foo, one];
            }
        });
        var abc = Abc(43);
        expect(abc.__name__).toEqual('Abc');
        expect(abc.foo).toEqual(43);
        expect(abc.bar('hi')).toEqual([43, 'hi']);
    });
    it('w/ functions', function(){
        var Abc = Class('Abc', [], {
            __init__:$m(function(self, a){
                self.g = a;
            }),
            bar:$m(function(self, a){
                return a+self.g;
            }),
        });
        expect(Abc).toThrowWith([],/^TypeError/);
        var abc = Abc(7);
        expect(abc.g).toEqual(7);
        expect(abc.bar(3)).toEqual(10);
        expect(abc.bar.__name__).toEqual('bar');
    });
    it('inheritence', function(){
        var Parent = Class('Parent', [], {
            __init__:$m(function __init__(self){
                self.x = 3;
            }),
            bar:$m(function bar(self, inc){
                self.x += inc;
                return self.x;
            }),
        });
        expect(Parent.__type__).toEqual('type');
        expect(Parent.__init__.__type__).toEqual(instancemethod);
        expect(Parent.__init__.im_class).toEqual(Parent);
        var Child = Class('Child', [Parent], {
            __init__:$m(function __init__(self){
                Parent.__init__(self);
                self.y = 5;
            }),
            baz:$m(function baz(self){
                return self.x+self.y;
            }),
        });
        expect(Child.__name__).toEqual('Child');
        expect(Child.__init__.im_class).toEqual(Child);
        expect(Child.__init__.__name__).toEqual('__init__');
        expect(Parent.__type__).toEqual('type');
        expect(Parent.__init__.__type__).toEqual(instancemethod);
        expect(Parent.__init__.im_class).toEqual(Parent);
        var b = Parent();
        var c = Child();
        expect(b.x).toEqual(3);
        expect(c.x).toEqual(3);
        expect(b.bar(12)).toEqual(15);
        expect(c.bar(4)).toEqual(7);
        expect(c.bar(1)).toEqual(8);
        expect(c.baz()).toEqual(13);
    });
    it('classmethod',function(){
        var Abc = Class('Abc', [], {
            a:12,
            man:classmethod($m(function(cls, a){
                cls.a += a;
                return cls.a;
            })),
        });
        var abc = Abc();
        expect(abc.a).toEqual(12);
        expect(abc.man(2)).toEqual(14);
        expect(Abc.man(3)).toEqual(17);
        expect(Abc.a).toEqual(17);
    });
    it('staticmethod', function(){
        var Abc = Class('Abc', [], {
            foo:staticmethod($m(function(a,b,c){
                return [a+b, c];
            })),
        });
        expect(Abc.foo(1,2,5)).toEqual([3,5]);
        expect(Abc().foo(4,2,3)).toEqual([6,3]);
    });
});

describe('pjs-modules.js', function() {
    it('general module test',function(){
        expect(true).toEqual(true, 'I don\'t think there\'s much I can test here in isolation');
    });
});

describe('pjs-builtins.js', function() {
    describe('module-imports', function(){
        var sys = __builtins__.__import__('sys');
        var numimports = 0;
        it('import sys',function(){
            expect(sys).toBe(__module_cache['<builtin>/sys.py']._module);
        });
        module('/one.py', function($) {
            $.__doc__ = 'a simple module';
            $.a = 4;
            $.b = $m(function(r){
                return r + $.a;
            });
            numimports += 1;
        });
        module('/two.py', function($) {
            $.one = __builtins__.__import__('one', $.__name__, $.__file__)
            $.c = 5;
        });
        it('multiple imports', function(){
            expect(numimports).toEqual(0);
            var one = __builtins__.__import__('one', '__main__', '/main.py');
            expect(numimports).toEqual(1);
            __builtins__.__import__('one', '__main__', '/main.py');
            expect(numimports).toEqual(1);
            expect(one.a).toEqual(4);
            expect(one.b(5)).toEqual(9);
        });
        it('manual reload', function(){
            delete sys.modules['one'];
            expect(defined(sys.modules['one'])).toEqual(false);
            __builtins__.__import__('one', '__main__', '/main.py');
            expect(numimports).toEqual(2);
        });
        it('auto reload', function(){
            var one = __builtins__.__import__('one', '__main__', '/main.py');
            expect(numimports).toEqual(2);
            __builtins__.reload(one);
            expect(numimports).toEqual(3);
        });
        it('nested import', function(){
            var one = __builtins__.__import__('one', '__main__', '/main.py');
            delete sys.modules['one'];
            var two = __builtins__.__import__('two', '__main__', '/main.py');
            expect(two).toBe(sys.modules['two']);
            expect(numimports).toEqual(4);
            expect(two.c).toEqual(5);
            one.a = 6;
            expect(two.one).not.toEqual(one);
            var one2 = __builtins__.__import__('one', '__main__', '/main.py');
            expect(two.one).toEqual(one2);
        });
    });

    describe('sys.py', function() {
        var sys = __builtins__.__import__('sys');
        //expect(sys.modules['/one.py']._module.a).toEqual(4);
    });

    describe('os/path.py', function() {
        var path = __builtins__.__import__('os.path');
        it('join', function(){
            expect(path.join).toReturnGiven([
                [['a','b'],'a/b'],
                [['a','/b'],'/b'],
                [['a/','b'],'a/b'],
                [['/a/b/../c','d'],'/a/b/../c/d']
            ]);
        });
        it('isabs', function(){
            expect(path.isabs).toReturnGiven([
                [['/a'], true],
                [['b'], false],
                [['one/two/'], false],
            ]);
        });
        it('abspath', function(){
            expect(path.abspath).toThrowWith(['not/absolute']);
            expect(path.abspath('/a/b/./../c/')).toEqual('/a/c');
            expect(path.abspath('/first/second/../../third/./fourth/../')).toEqual('/third');
        });
        it('dirname', function(){
            expect(path.dirname).toReturnGiven([
                ['/one/two','/one'],
                ['/many/layers/../of/stuff.txt','/many/layers/../of'],
                ['relative/path','relative'],
                ['ends/in/slash/','ends/in/slash']
            ]);
        });
        it('basename', function(){
            expect(path.basename).toReturnGiven([
                ['/one/two.txt','two.txt'],
                ['rela/tive/yes','yes'],
                ['ends/../in/slash/','']
            ]);
        });
        // normpath is covered by abspath
    });

    describe('misc builtins', function(){
        it('isinstance', function() {
            var $ = __builtins__;
            var a=Class('a',[],{});
            var b=Class('b',[],{});
            var c=Class('c',[a],{});
            expect($.isinstance(a(),a)).toBe(true);
            expect($.isinstance(b(),a)).toBe(false);
            expect($.isinstance).toThrowWith([a,a]);
            expect($.isinstance(c(),a)).toBe(true);
        });
        it('issubclass', function() {
            var $ = __builtins__;
            var a=Class('a',[],{});
            var b=Class('b',[],{});
            var c=Class('c',[a],{});
            expect($.issubclass).toReturnGiven([
                [[a,a],true],
                [[a,b],false],
                [[a,c],false],
                [[c,a],true]
            ]);
        });
        /** complain about unimplemented stuff...
        it('list', function(){
            expect(false).toBe('need to *really* implement lists...');
        });
        it('iter', function(){
            expect(false).toBe('iterators to');
        });
        it('print', function(){
            // TODO: implement file streams? sys.stdout?
            // mk --> get StringIO, convert it w/ pjs, and make it work =)
            expect(false).toBe('havent quite gotten sys.stdout working...or >>');
        });
        it('tuple', function(){
            expect('tuples', 'almost done');
        });
        it('dict', function(){
            expect(false).toBe('should do this too');
        });
        **/
    });

    describe('builtin types', function(){
        describe('tuple', function() {
            var _ = __builtins__;
            it('simple', function() {
                var t = _.tuple();
                expect(_.len(t)).toBe(0);
                expect(t.__getitem__).toThrowWith([0], /IndexError/);
                expect(t.index).toThrowWith([0], /IndexError/);
            });
            it('small', function(){
                var e = _.tuple([1,2,'3',1]);
                expect(_.len(e)).toBe(4);
                expect(e.__getitem__(0)).toBe(1);
                expect(e.__getitem__(2)).toBe('3');
                expect(e.count(1)).toBe(2);
                expect(e.count(4)).toBe(0);
                expect(e.index(1)).toBe(0);
            });
            it('equal', function(){
                var a = _.tuple([3,4]);
                var b = _.tuple([3,4]);
                var c = _.tuple([1,2,3]);
                var d = _.tuple(c);
                expect(_.eq(a,b)).toBe(true);
                expect(_.eq(c,d)).toBe(true);
                expect(_.eq(a,c)).toBe(false);
            });
            it('ops', function(){
                var a = _.tuple([3,4]);
                var c = _.tuple([1,2,3]);
                expect(_.str(a)).toBe('(3, 4)');
                expect(a.__add__(c).as_js()).toEqual([3,4,1,2,3]);
            });
        });
    });
});

