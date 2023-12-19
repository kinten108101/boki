#!/usr/bin/env sh
rm -rf build-meson && \
meson setup --reconfigure build-meson && \
sudo meson install -C build-meson
