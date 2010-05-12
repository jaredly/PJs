

default:
	@echo "options: jslib, pylib, test-(js|py)"
	@echo $(JSFILES)

jslib: build/pjslib.js

build/pjslib.js: jslib/*.js
	cat jslib/functions.js jslib/classes.js jslib/modules.js jslib/__builtin__.js > build/pjslib.js

pylib:
	@echo "this isn't supported ATM"

test-js: jslib
	@js test/runtests.js

test-py: pylib
	@echo "not implemented yet"

clean:
	rm -rf build/*
