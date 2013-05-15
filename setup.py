from distutils.core import setup
import setuptools

setup(name='PJs',
      version='0.0.0',
      description='kinda like pyjamas, but quicker, cleaner, and easier. has the goal of generating readable, usable *robust* javascript code from python code',
      author='Jared Forsyth',
      author_email='jared@jaredforsyth.com',
      url='http://jaredforsyth.com/projects/pjs/',
      packages=['pjs', 'pjs.data', 'pjs.templates', 'jslib'],
      classifiers=['Programming Language :: Python :: 2.7']
     )
