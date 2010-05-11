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
            __init__:$m(function(self){
                self.x = 3;
            }),
            bar:$m(function(self, inc){
                self.x += inc;
                return self.x;
            }),
        });
        var Child = Class('Child', [Parent], {
            __init__:$m(function(self){
                Parent.__init__(self);
                self.y = 5;
            }),
            baz:$m(function(self){
                return self.x+self.y;
            }),
        });
        var b = Parent(), c = Child();
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
});


