#!/usr/bin/env sh

# EXPLANATION
# - `flatpak run org.flatpak.Builder`: The Flatpak Builder program.
# - `--force-clean`: Force delete build folder (`build-flatpak`) before building. Otherwise you'll have to delete it manually between builds.
# - `--keep-build-dirs`: Force keep previous build folders in `.flatpak-builder/build`, for your debugging purposes. As a consequence, project size will increase exponentially, so be sure to frequently clean these folders.
# - `--disable-updates`: Force not fetching online for dependency module changes. The only dependency module is blueprint-compiler. Otherwise, offline development won't be possible as Flatpak Builder will nag that internet connection is required for fetching.
# - `--install`: Automatically install the project after build completion.
# - `--user`: Will install app in userspace.
# - `build-flatpak`: Name of the output build folder. This is hardcoded in .gitignore, you should not change this.
# - `com.github.kinten108101.Boki.json`: Path to the input manifest file of this app for Flatpak Builder

flatpak run org.flatpak.Builder --force-clean --keep-build-dirs --disable-updates --user --install build-flatpak com.github.kinten108101.Boki.json
