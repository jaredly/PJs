#!/usr/bin/env python
from distutils.core import setup
import setuptools

setup(name='PJs',
      version='0.0.2',
      description='kinda like pyjamas, but quicker, cleaner, and easier. has the goal of generating readable, usable *robust* javascript code from python code',
      author='Jared Forsyth',
      author_email='jared@jaredforsyth.com',
      url='http://jaredforsyth.com/projects/pjs/',
      packages=['pjs'],
      install_requires=['pbj'],
      include_package_data=True,
      classifiers=['Programming Language :: Python :: 2.7']
     )
