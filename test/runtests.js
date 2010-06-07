var window = {};
load("build/pjslib.js");

load('test/js/jasmine/lib/jasmine-0.10.3.js');
load('test/js/jasmine/lib/rhino.js');

load('test/js/lib.js');

var jasmineEnv = jasmine.getEnv();
jasmineEnv.reporter = new jasmine.RhinoReporter();
jasmineEnv.execute();
