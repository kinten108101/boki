#!/usr/bin/env sh
sh scripts/ui-compile.sh && \
rm -rf build-meson && \
meson setup --reconfigure build-meson && \
sudo meson install -C build-meson
