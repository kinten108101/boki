#!/usr/bin/env sh
FILES=
IFS=','
for file in $@; do
	FILES="${FILES} data/ui/src/${file}"
done
unset IFS
blueprint-compiler batch-compile data/ui data/ui/src ${FILES}
