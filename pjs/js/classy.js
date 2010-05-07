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

var to_array = function(a){return Array.prototype.slice.call(a,0);};

function __instancemethod(self, val) {
    var fn = function() {
        return val.apply(this, [self].concat(to_array(arguments)));
    };
    fn.__type__ = 'instancemethod';
    fn.__wraps__ = val;
    if (val.args) {
        fn.args = function(pos, kwd) {
            return val.args([self].concat(pos), kwd);
        };
    }
    for (var k in val) {
        if (!defined(fn[k])) {
            fn[k] = val[k];
        }
    }
    fn.__name__ = val.name;
    fn.name = val.name;
    return fn;
}

var type = $m(function type(name, bases, namespace) {
    var cls = function() {
        var self = {};
        self.__init__ = function(){};
        self.__class__ = cls;
        self.__type__ = 'instance';

        for (var attr in cls) {
            var val = cls[attr];
            if (typeof(val) !== 'function' || (defined(val.__type__) && val.__type__ !== 'method')) {
                self[attr] = val;
            } else {
                self[attr] = __instancemethod(self, val);
                self[attr].name = attr;
                self[attr].__name__ = attr;
            }
        }
        self.__init__.apply(null, arguments);
        return self;
    };
    cls.__type__ = 'type';
    cls.__bases__ = bases;
    cls.__name__ = name;
    cls.__str__ = $m(function(self){
        return '<' + self.__module__ + '.' + self.__name__ + ' instance at 0x10beef01>';
    });
    for (var i=0;i<bases.length;i++) {
        for (var key in bases[i]) {
            if (key === 'prototype') continue;
            var val = bases[i][key];
            if (val.__cls_classmethod)
                val = __classmethod(cls, val);
            cls[key] = val;
        }
    }
    for (var key in namespace) {
        cls[key] = namespace[key];
    }
    return cls;
});

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

function staticmethod(method){
    method.__type__ = 'staticmethod'; // as the type is no longer "method", it won't be wrapped.
    return method;
}

var Class = type;

