#!/usr/bin/env sh
FILENAME=$1
blueprint-compiler compile --output "data/ui/${FILENAME}.ui" "data/ui/src/${FILENAME}.blp"
