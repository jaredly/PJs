PJS
===

kinda like pyjamas...

but shorter. quicker. cleaner. more convenient. Oh, and, *easier*. Takes care
of error handling, so you don't get cryptic error messages that originate from
javascript's lazyness regarding undefined variables.

PJs has the goal of generating readable, usable *robust* javascript code from
python code, and of providing some libraries to make web development easier.

Independent Branch
====================

**this branch is for maintaining the functions.js and classes.js files in such a
way that they would be usable independent of the main PJs project. This branch
was created in anticipation of the changes being introduced to these two
libraries that will make them inextricable from the main PJs library.**

Things you can't do *(yet)*:

- python magic:

  - __add__
  - __sub__
  - __mul__

These are planned, but currently descisions have to be made regarding the
performance losses associated with these magic functions.

Things you can do:

- just about everything else

if you find a bug or something you don't like, feel free to file a ticket on
github, or *even better*, fork the repo, fix your problem, and then pull
request. We love pull requests.

Ok, so this project is starting out. And so none of it is implemented yet. But
I'm working on it ;)

To keep in mind:

- scoping (globals?)
- module importing...reload...sys.modules...

Pythonic Functions
==================

Here's a bit from the top of the functions.js, which allows for pythonic function in javascript!

(pjs provides the function $m for creating pythonic functions)

How to use:

- $m([defaults], [aflag], [kflag], fn);
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

    var foo = $m({c:null, d:10}, true, true, function foo(a, b, c, d, args, kwargs) {
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
 
python-style classes will follow shortly.
