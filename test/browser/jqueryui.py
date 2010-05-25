#!/usr/bin/env python

def onload(event):
    print event
    jq = window.jQuery
    jq(js('#tabs')).tabs()

    print jq(js('#tabs')).length

if __name__ == '__main__':
    window.jQuery(js("document")).ready(onload);

# vim: et sw=4 sts=4
