
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

test-py: jslib py-tests
	@for name in $(PY_TEST); do \
		python $$name.py > _py.log; \
		js $$name.js > _js.log; \
		if [ `diff _py.log _js.log|wc -l` -eq 0 ]; \
		then \
			echo "$$name passed"; \
		else \
			diff _py.log _js.log|less; \
		fi; \
		rm -f _py.log _js.log; \
	done

clean:
	rm -rf build/*

PY_TEST := $(patsubst %.py,%,$(wildcard test/py/*.py))
PY_JS_TEST := $(patsubst %.py,%.js,$(wildcard test/py/*.py))

py-tests:$(PY_TEST)

$(PY_TEST):
	@./build.py $@.py > $@.js

build/pjslib.js: jslib/*.js
	@cat jslib/functions.js jslib/classes.js jslib/modules.js jslib/__builtin__.js > build/pjslib.js

test/example.js: test/example.py jslib pjs/convert.py
	@./build.py test/example.py > test/example.js

