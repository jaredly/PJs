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

var to_array = function(a){return Array.prototype.slice.call(a,0);};

function new_class(bases){
    bases = typeof(bases)=='undfined'?[]:bases;
    var instance_method = function(cls, self, func){
        self[func] = function(){
            var args = [self].concat(to_array(arguments));
            return cls[func].apply(this,args);
        }
        /**
        self[func].prefill = function(){
            var preargs = Array.prototype.slice.call(arguments,0);
            preargs.unshift(self);
            return function(){
                return cls[func].apply(this,preargs.concat(Array.prototype.slice.call(arguments,0)));
            };
        };
        self[func].noargs = function(){
            return cls[func].apply(this,[self]);
        };
        **/
    }

    var cls = function(){
        var self = {};self.__init__ = function(){};
        self.__class__ = cls;
        var args = to_array(arguments);

        for (attr in cls){
            if (typeof(cls[attr])!="function" || cls[attr].__cls_classmethod || cls[attr].__cls_staticmethod){
                self[attr] = cls[attr];
            }else{
                instance_method(cls,self,attr);
            }
        }

        self.__init__.apply(self,args);
        return self;
    };

    for (var i=0;i<bases.length;i++){
        var base = bases[i];
        for (attr in base){
            if (attr=='prototype')continue;
            cls[attr] = base[attr];
        }
    }

    return cls
}

function _make_classmethod(cls, method) {
    function meta() {
        args = [cls].concat(to_array(arguments));
        return method.apply(null, args);
    }
    meta.__cls_classmethod = true;
    meta.__cls_wrapped = method;
    return meta;
}

// decorators
function classmethod(method){
    method.__todo_classmethod = true;
    return method;
}

function staticmethod(method){
    method.__cls_staticmethod = true;
    return method;
}

function Class(inherits,def){
    var that = new_class.apply(null,inherits || []);
    for (item in def){
        if (typeof(def[item]) == 'function') {
            if (def[item].__todo_classmethod) {
                def[item] = _make_classmethod(that, def[item]);
            }
        }
        that[item] = def[item];
    }
    return that;
}
