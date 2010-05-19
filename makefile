

default:
	@echo "options: jslib, pylib, test-(js|py)"
	@echo $(JSFILES)

jslib: build/pjslib.js

build/pjslib.js: jslib/*.js
	cat jslib/functions.js jslib/classes.js jslib/modules.js jslib/__builtin__.js > build/pjslib.js

test/example.js: test/example.py
	@./build.py test/example.py > test/example.js

pylib:
	@echo "this isn't supported ATM"

test-js: jslib
	@js test/runtests.js

test-py: pylib test/example.py test/example.js
	@python test/example.py > _python.log
	@js test/example.js > _js.log
	@diff _python.log _js.log | less
	@rm -f _python.log _js.log

clean:
	rm -rf build/*
