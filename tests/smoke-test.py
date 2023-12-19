#!/usr/bin/python

from testutil import *

from gi.repository import Gio, GLib

import os
import sys
import pyatspi
from dogtail import tree
from dogtail import utils
from dogtail.procedural import *


def active(widget):
    return widget.getState().contains(pyatspi.STATE_ARMED)


def visible(widget):
    return widget.getState().contains(pyatspi.STATE_VISIBLE)


init()

app = start()
print("app started")
assert app is not None

# test something

print("tearing down")
fini()
