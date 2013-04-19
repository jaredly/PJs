PJs
===

kinda like pyjamas...

but shorter. quicker. cleaner. more convenient. Oh, and, *easier*. Takes care
of error handling, so you don't get cryptic error messages that originate from
javascript's lazyness regarding undefined variables.

PJs has the goal of generating readable, usable *robust* javascript code from
python code, and of providing some libraries to make web development easier.

Installation
------------

I don't yet have a dist on pypi, so just clone the repo.

If you want to run the tests, ``pjs`` depends on ``pbj`` so you first need to
``pip install pbj``. Pbj is a build tool that I wrote, and you can invoke it
(once installed) with ``./make.pbj`` in the ``pjs`` directory. 

Usage
-----

The ``convert.py`` should work pretty well for playing around with pjs.


Recent Addtions
---------------

- nested class support (full namespacing!!)
- operator overloading
- easy javascript embedding


To make a javascript function call, prepend ``js.`` to the call (I'm reserving
the name ``js``; I hope you don't mind). Any calls starting with ``window.``
are treated as javascript calls as well. The difference is that the ``js``
prefix is removed -- it is assumed that you are working with a local variable.

::

    jq = window.jQuery
    def make_tabs(id):
        js.jq(id).tabs()

This is necessary because PJs wraps strings, tuples, lists, and dictionarys,
so jQuery wouldn't know what to do with ``jq("hi")`` which
otherwise would be translated to ``jq($b.str("hi"))``. As it is, the above
code becomes::

    _.jq = window.jQuery;
    _.make_tabs = $def(function $_make_tabs(id) {
      _.jq($b.js(id)).tabs();
    });

Now that might be a bit confusing, but the important thing is that PJs knows
to convert ``id`` to a javascript type (the added builtin function ``js`` converts a
python object to the corresponding javascript type).

If you want to avoid that kind of magic, that's fine too, but you need to
convert the function arguments yourself. In python, you'd have::

    jq = window.jQuery
    def make_tabs(id):
      jq(js(id)).tabs()

Not much different in this example, but for more complicated expressions such
as ``foo(a, b, c, d).bar(e, f)`` it's much simpler to just put a ``js.`` at
the very beginning.

One thing for which you must rely on magic (sorry) is subscripting; in PJs, in
order to allow for __get/setitem\__ manipulation, expressions such as
``people[gender]`` are converted to ``people.__getitem__(gender)``. If you've
got a javascript-style list, the magic ``js.`` prefix will preserve
subscripts (and convert the argument back to javascript). So
``js.people[gender]`` becomes ``people[$b.js(gender)]``. Slicing is also
handled intelligently; ``js.people[start:end]`` comes out as
``people.slice(start, end)``.
       




Things you can't do:

- python attribute magic:

  - __getattr__
  - __setattr__

These will have major performance implications; I imagine they might be
enableable via a flag -- for most programs that level of control isn't
absolutely nessecary.

Things you can do:

- just about everything else
- classes
- modules!
- functions
- decorators

  - classmethod
  - staticmethod

- operator magic; __add__, __mul__ etc.

if you find a bug or something you don't like, feel free to file a ticket on
github, or *even better*, fork the repo, fix your problem, and then pull
request. We love pull requests.

Pythonic Functions
==================

Here's a bit from the top of the functions.js, which allows for pythonic function in javascript!

(pjs provides the function $def for creating pythonic functions)

How to use:

- $def([defaults], [aflag], [kflag], fn);
- defaults, aflag, and kflag are all optional, but required to be in that
  order to avoid ambiguity.
- defaults = an associative array of key, value pairs; the key is the arg
  name, anf the vaule is default value.
- aflag signals that the last (or second-to-last, if kflag is true) is to be
  populated with excess positional arguments. (in python, this is the \*args
  syntax).
- kflag is like aflag, but for dictionary arguments, e.g. \**kwargs.
- there's also checks happening the whole way, so you won't be stuck debugging
  another annoying undefined error.

Here's an example that uses all of these:

::

    var foo = $def({c:null, d:10}, true, true, function foo(a, b, c, d, args, kwargs) {
        // only a and b are required, and excess positional and dictionary
        // arguments will be captured.
        console.log([a, b, c, d, args, kwargs]);
    });
    
    // and in use...

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
 
python-style classes are also implemented, with full namespacing!
