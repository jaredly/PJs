/*** File generated by PJs http://jaredforsyth.com/projects/pjs ***/

// from source file /home/jared/clone/pjs/test/py2js/functions/aug.py

load("build/pjslib.js");
var console = {log:function(){print.apply(this, arguments);}};
var window  = this;
module('/home/jared/clone/pjs/test/py2js/functions/aug.py', function (_) {
    _.__doc__ = "";
    var __pjs_tmp_module = $b.__import__("__future__", _.__name__, _.__file__);
    _.division = __pjs_tmp_module.division;
    _.a = 244;
    _.b = 23;
    $b.print(_.a);//, true
    _.a = $b.add(_.a, 4);
    $b.print(_.a);//, true
    _.a = $b.sub(_.a, 2);
    $b.print(_.a);//, true
    _.a = $b.lshift(_.a, 4);
    $b.print(_.a);//, true
    _.a = $b.rshift(_.a, 2);
    $b.print(_.a);//, true
    _.a = $b.bitor(_.a, 234324);
    $b.print(_.a);//, true
    _.a = $b.bitand(_.a, 213213);
    $b.print(_.a);//, true
    _.a = $b.bitxor(_.a, 2312);
    $b.print(_.a);//, true
    _.a = $b.floordiv(_.a, 324);
    $b.print(_.a);//, true
    _.a = $b.add(_.a, 1);
    $b.print(_.a);//, true
    _.a = $b.div(_.a, 2);
    $b.print(_.a);//, true
    $b.print(_.b);//, true
    _.b = $b.pow(_.b, 3);
    $b.print(_.b);//, true
});

module('/usr/lib/python2.6/__future__.py', function (_) {
    _.__doc__ = 'Record of phased-in incompatible language changes.\n' +
'\n' +
'Each line is of the form:\n' +
'\n' +
'    FeatureName = "_Feature(" OptionalRelease "," MandatoryRelease ","\n' +
'                              CompilerFlag ")"\n' +
'\n' +
'where, normally, OptionalRelease < MandatoryRelease, and both are 5-tuples\n' +
'of the same form as sys.version_info:\n' +
'\n' +
'    (PY_MAJOR_VERSION, # the 2 in 2.1.0a3; an int\n' +
'     PY_MINOR_VERSION, # the 1; an int\n' +
'     PY_MICRO_VERSION, # the 0; an int\n' +
'     PY_RELEASE_LEVEL, # "alpha", "beta", "candidate" or "final"; string\n' +
'     PY_RELEASE_SERIAL # the 3; an int\n' +
'    )\n' +
'\n' +
'OptionalRelease records the first release in which\n' +
'\n' +
'    from __future__ import FeatureName\n' +
'\n' +
'was accepted.\n' +
'\n' +
'In the case of MandatoryReleases that have not yet occurred,\n' +
'MandatoryRelease predicts the release in which the feature will become part\n' +
'of the language.\n' +
'\n' +
'Else MandatoryRelease records when the feature became part of the language;\n' +
'in releases at or after that, modules no longer need\n' +
'\n' +
'    from __future__ import FeatureName\n' +
'\n' +
'to use the feature in question, but may continue to use such imports.\n' +
'\n' +
'MandatoryRelease may also be None, meaning that a planned feature got\n' +
'dropped.\n' +
'\n' +
'Instances of class _Feature have two corresponding methods,\n' +
'.getOptionalRelease() and .getMandatoryRelease().\n' +
'\n' +
'CompilerFlag is the (bitfield) flag that should be passed in the fourth\n' +
'argument to the builtin function compile() to enable the feature in\n' +
'dynamically compiled code.  This flag is stored in the .compiler_flag\n' +
'attribute on _Future instances.  These values must match the appropriate\n' +
'#defines of CO_xxx flags in Include/compile.h.\n' +
'\n' +
'No feature line is ever to be deleted from this file.';
    $b.str('Record of phased-in incompatible language changes.\n' +
    '\n' +
    'Each line is of the form:\n' +
    '\n' +
    '    FeatureName = "_Feature(" OptionalRelease "," MandatoryRelease ","\n' +
    '                              CompilerFlag ")"\n' +
    '\n' +
    'where, normally, OptionalRelease < MandatoryRelease, and both are 5-tuples\n' +
    'of the same form as sys.version_info:\n' +
    '\n' +
    '    (PY_MAJOR_VERSION, # the 2 in 2.1.0a3; an int\n' +
    '     PY_MINOR_VERSION, # the 1; an int\n' +
    '     PY_MICRO_VERSION, # the 0; an int\n' +
    '     PY_RELEASE_LEVEL, # "alpha", "beta", "candidate" or "final"; string\n' +
    '     PY_RELEASE_SERIAL # the 3; an int\n' +
    '    )\n' +
    '\n' +
    'OptionalRelease records the first release in which\n' +
    '\n' +
    '    from __future__ import FeatureName\n' +
    '\n' +
    'was accepted.\n' +
    '\n' +
    'In the case of MandatoryReleases that have not yet occurred,\n' +
    'MandatoryRelease predicts the release in which the feature will become part\n' +
    'of the language.\n' +
    '\n' +
    'Else MandatoryRelease records when the feature became part of the language;\n' +
    'in releases at or after that, modules no longer need\n' +
    '\n' +
    '    from __future__ import FeatureName\n' +
    '\n' +
    'to use the feature in question, but may continue to use such imports.\n' +
    '\n' +
    'MandatoryRelease may also be None, meaning that a planned feature got\n' +
    'dropped.\n' +
    '\n' +
    'Instances of class _Feature have two corresponding methods,\n' +
    '.getOptionalRelease() and .getMandatoryRelease().\n' +
    '\n' +
    'CompilerFlag is the (bitfield) flag that should be passed in the fourth\n' +
    'argument to the builtin function compile() to enable the feature in\n' +
    'dynamically compiled code.  This flag is stored in the .compiler_flag\n' +
    'attribute on _Future instances.  These values must match the appropriate\n' +
    '#defines of CO_xxx flags in Include/compile.h.\n' +
    '\n' +
    'No feature line is ever to be deleted from this file.\n' +
    '');
    _.all_feature_names = $b.list([$b.str('nested_scopes'), $b.str('generators'), $b.str('division'), $b.str('absolute_import'), $b.str('with_statement'), $b.str('print_function'), $b.str('unicode_literals')]);
    _.__all__ = $b.add($b.list([$b.str('all_feature_names')]), _.all_feature_names);
    _.CO_NESTED = 16;
    _.CO_GENERATOR_ALLOWED = 0;
    _.CO_FUTURE_DIVISION = 8192;
    _.CO_FUTURE_ABSOLUTE_IMPORT = 16384;
    _.CO_FUTURE_WITH_STATEMENT = 32768;
    _.CO_FUTURE_PRINT_FUNCTION = 65536;
    _.CO_FUTURE_UNICODE_LITERALS = 131072;
    _._Feature = Class('_Feature', [], (function(){
        var __0 = {};
        __0.__init__ = $def(function $___init__(self, optionalRelease, mandatoryRelease, compiler_flag) { // 75
            self.optional = optionalRelease;
            self.mandatory = mandatoryRelease;
            self.compiler_flag = compiler_flag;
        });
        __0.__init__.__module__ = _.__name__;
        __0.__init__.__name__ = $b.str("__init__");
        __0.getOptionalRelease = $def(function $_getOptionalRelease(self) { // 80
            $b.str('Return first release in which this feature was recognized.\n' +
            '\n' +
            '        This is a 5-tuple, of the same form as sys.version_info.\n' +
            '        ');
            return self.optional;
        });
        __0.getOptionalRelease.__module__ = _.__name__;
        __0.getOptionalRelease.__name__ = $b.str("getOptionalRelease");
        __0.getMandatoryRelease = $def(function $_getMandatoryRelease(self) { // 88
            $b.str('Return release in which this feature will become mandatory.\n' +
            '\n' +
            '        This is a 5-tuple, of the same form as sys.version_info, or, if\n' +
            '        the feature was dropped, is None.\n' +
            '        ');
            return self.mandatory;
        });
        __0.getMandatoryRelease.__module__ = _.__name__;
        __0.getMandatoryRelease.__name__ = $b.str("getMandatoryRelease");
        __0.__repr__ = $def(function $___repr__(self) { // 97
            return $b.add($b.str('_Feature'), $b.repr($b.tuple([self.optional, self.mandatory, self.compiler_flag])));
        });
        __0.__repr__.__module__ = _.__name__;
        __0.__repr__.__name__ = $b.str("__repr__");
        return __0;
    }()));
    _._Feature.__module__ = _.__name__;
    _.nested_scopes = _._Feature($b.tuple([2, 1, 0, $b.str('beta'), 1]), $b.tuple([2, 2, 0, $b.str('alpha'), 0]), _.CO_NESTED);
    _.generators = _._Feature($b.tuple([2, 2, 0, $b.str('alpha'), 1]), $b.tuple([2, 3, 0, $b.str('final'), 0]), _.CO_GENERATOR_ALLOWED);
    _.division = _._Feature($b.tuple([2, 2, 0, $b.str('alpha'), 2]), $b.tuple([3, 0, 0, $b.str('alpha'), 0]), _.CO_FUTURE_DIVISION);
    _.absolute_import = _._Feature($b.tuple([2, 5, 0, $b.str('alpha'), 1]), $b.tuple([2, 7, 0, $b.str('alpha'), 0]), _.CO_FUTURE_ABSOLUTE_IMPORT);
    _.with_statement = _._Feature($b.tuple([2, 5, 0, $b.str('alpha'), 1]), $b.tuple([2, 6, 0, $b.str('alpha'), 0]), _.CO_FUTURE_WITH_STATEMENT);
    _.print_function = _._Feature($b.tuple([2, 6, 0, $b.str('alpha'), 2]), $b.tuple([3, 0, 0, $b.str('alpha'), 0]), _.CO_FUTURE_PRINT_FUNCTION);
    _.unicode_literals = _._Feature($b.tuple([2, 6, 0, $b.str('alpha'), 2]), $b.tuple([3, 0, 0, $b.str('alpha'), 0]), _.CO_FUTURE_UNICODE_LITERALS);
});

__builtins__.__import__('sys').argv = __builtins__.list(arguments);
var pjs_main = __builtins__.run_main('/home/jared/clone/pjs/test/py2js/functions/aug.py', ['/home/jared/clone/pjs', '/home/jared/clone/pjs', '/home/jared/python', '/usr/lib/python2.6', '/usr/lib/python2.6/plat-linux2', '/usr/lib/python2.6/lib-tk', '/usr/lib/python2.6/lib-old', '/usr/lib/python2.6/lib-dynload', '/usr/lib/python2.6/dist-packages', '/usr/lib/python2.6/dist-packages/PIL', '/usr/lib/python2.6/dist-packages/gst-0.10', '/usr/lib/pymodules/python2.6', '/usr/lib/python2.6/dist-packages/gtk-2.0', '/usr/lib/pymodules/python2.6/gtk-2.0', '/usr/local/lib/python2.6/dist-packages']);

