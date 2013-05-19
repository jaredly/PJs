var window = {};
load("pjs/data/pjslib.js");

load('test/js/jasmine/lib/jasmine-0.10.3.js');

load('test/js/lib.js');

var jasmineEnv = jasmine.getEnv();
jasmineEnv.reporter = new jasmine.Reporter();
jasmineEnv.execute();
