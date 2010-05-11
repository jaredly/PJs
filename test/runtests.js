load("pjs/js/functions.js", "pjs/js/classes.js", "pjs/js/modules.js",
     "pjs/js/__builtin__.js");

load('test/jasmine/lib/jasmine-0.10.3.js');
load('test/jasmine/lib/rhino.js');

// jasmine.include('js/lib.js', false);
load('test/js/lib.js');

var jasmineEnv = jasmine.getEnv();
jasmineEnv.reporter = new jasmine.RhinoReporter();
jasmineEnv.execute();

