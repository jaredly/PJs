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

/** general module loading... not spectacular, I know; it gets better when you
 * add sys and __builtins__
 **/

var __module_cache = {};
function module(filename, fn) {
    var that = {};
    that.__file__ = filename;
    that.__init__ = fn;
    that.load = function(name) {
        var mod = {};
        mod.__name__ = name;
        mod.__file__ = that.__file__;
        mod.__dict__ = mod;
        fn(mod);
        that._module = mod;
        return mod;
    };
    __module_cache[that.__file__] = that;
}

