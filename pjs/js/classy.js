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

/** python-style classes in javascript!! **/

var to_array = function(a){return Array.prototype.slice.call(a,0);};

function __instancemethod(self, val) {
    var fn = function() {
        return val.apply(this, [self].concat(to_array(arguments)));
    };
    fn.__type__ = 'instancemethod';
    fn.__wraps__ = val;
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
            }
        }
        self.__init__.apply(null, arguments);
        return self;
    };
    cls.__type__ = 'type';
    cls.__bases__ = bases;
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

function __classmethod(cls, val)
    var fn = function() {
        return val.apply(this, [cls].concat(to_array(arguments)));
    };
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

var class = type;

