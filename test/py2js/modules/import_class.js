/*** File generated by PJs http://jaredforsyth.com/projects/pjs ***/

// from source file /home/jared/clone/pjs/test/py2js/modules/import_class.py

load("./build/pjslib.js");
var console = {log:function(){print.apply(this, arguments);}};
module('/home/jared/clone/pjs/test/py2js/modules/import_class.py', function (_) {
    _.__doc__ = "";
    _.modules = $b.__import__("modules.klasses", _.__name__, _.__file__);
    _.k = _.modules.klasses.klass();
    _.k.sayhello();
    _.modules.klasses.klass.sayhello();
});

module('/home/jared/clone/pjs/test/py2js/modules/modules/klasses.py', function (_) {
    _.__doc__ = "";
    _.baseklass = Class('baseklass', [$b.object], (function(){
        var __1 = {};
        __1.sayhello = $b.staticmethod($def(function $_sayhello() { // 4
            $b.print($b.str('baseklass says hello'));//, true
        }));
        __1.sayhello.__module__ = _.__name__;
        __1.sayhello.__name__ = $b.str("sayhello");
        return __1;
    }()));
    _.baseklass.__module__ = _.__name__;
    _.klass = Class('klass', [_.baseklass], (function(){
        var __1 = {};
        
        return __1;
    }()));
    _.klass.__module__ = _.__name__;
    if ($b.bool($b.do_ops(_.__name__, '==', $b.str('__main__'))) === true) {
        _.k = _.klass();
        _.k.sayhello();
        _.klass.sayhello();
        _.baseklass.sayhello();
    }
});

__builtins__.__import__('sys').argv = __builtins__.list(arguments);
__builtins__.run_main('/home/jared/clone/pjs/test/py2js/modules/import_class.py', ['/home/jared/clone/pjs', '/home/jared/clone/pjs', '/home/jared/python', '/usr/lib/python2.6', '/usr/lib/python2.6/plat-linux2', '/usr/lib/python2.6/lib-tk', '/usr/lib/python2.6/lib-old', '/usr/lib/python2.6/lib-dynload', '/usr/lib/python2.6/dist-packages', '/usr/lib/python2.6/dist-packages/PIL', '/usr/lib/python2.6/dist-packages/gst-0.10', '/usr/lib/pymodules/python2.6', '/usr/lib/python2.6/dist-packages/gtk-2.0', '/usr/lib/pymodules/python2.6/gtk-2.0', '/usr/local/lib/python2.6/dist-packages']);
