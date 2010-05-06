python test/example.py > python_output.log
./build.py test/example.py > test/example.js
rhino test/example.js > js_output.log
diff python_output.log js_output.log
