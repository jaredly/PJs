
default:
	@echo "options: jslib, pylib, test-(js|py)"

jslib: build/pjslib.js

pylib:
	@echo "this isn't supported ATM"

test-js: jslib
	@js test/runtests.js

test-py: py-tests

clean:
	rm -rf build
	rm -rf test/py/*.js

PY_TEST := $(patsubst %.py,%,$(wildcard test/py/*.py))
PY_JS_TEST := $(patsubst %.py,%.js,$(wildcard test/py/*.py))

py-tests:$(PY_TEST)

$(PY_TEST): pjs/convert.py jslib
	@./convert.py $@.py -i --rhino -l ./build/ $@.js
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
	@mkdir build &> /dev/null || :
	@cat jslib/functions.js jslib/classes.js jslib/modules.js jslib/__builtin__.js > build/pjslib.js

