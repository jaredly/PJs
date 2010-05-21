
default:
	@echo "options: jslib, pylib, test-(js|py)"
	@echo $(JSFILES)

jslib: build/pjslib.js

example:
	./build.py test/example.py > test/example.js

pylib:
	@echo "this isn't supported ATM"

test-js: jslib
	@js test/runtests.js

test-py: py-tests

clean:
	rm -rf build/*
	rm -rf test/py/*.js

PY_TEST := $(patsubst %.py,%,$(wildcard test/py/*.py))
PY_JS_TEST := $(patsubst %.py,%.js,$(wildcard test/py/*.py))

py-tests:$(PY_TEST)

$(PY_TEST): pjs/convert.py jslib
	@./build.py $@.py -i > $@.js
	@js $@.js > _js.log
	@python $@.py > _py.log
	@if [ `diff _py.log _js.log|wc -l` -eq 0 ]; \
	then \
		echo "$@ passed"; \
	else \
		echo "$@ failed"; \
		diff _py.log _js.log|less; \
		exit; \
	fi; \
	rm -f _py.log _js.log;


build/pjslib.js: jslib/*.js
	@cat jslib/functions.js jslib/classes.js jslib/modules.js jslib/__builtin__.js > build/pjslib.js

test/example.js: test/example.py jslib pjs/convert.py
	@./build.py test/example.py > test/example.js

