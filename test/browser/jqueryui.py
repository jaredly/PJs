#!/usr/bin/env python

class SplitPane:
    def __init__(self, node):
        self.node = node

'''Ways of embedding javascript code...

prepend js. to everything.... the js. gets removed...

so

hello(js.jQuery('world'))

becomes

hello(jQuery($b.js($b.str('world'))))

'''
import json

jq = window.jQuery;

def onload(jQuery):
    js.jq('#tabs').tabs()
    print js.jq('#tabs').length
    print json.dumps(['hello', 'man', {'yeah':6,5:2}])

if __name__ == '__main__':
    js.jq("document").ready(onload);

# vim: et sw=4 sts=4
