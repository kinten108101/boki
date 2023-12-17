# Boki

Boki is a Steam Workshop downloader client for the GNOME desktop.

## Development

This project uses Flatpak, an app container technology. Your Linux distro should have this installed by default, otherwise you'll have to install it manually.

Install Flatpak Builder, required to build Flatpak apps:

```sh
flatpak install org.flatpak.Bulder
```

Build and install the app:

```sh
flatpak run org.flatpak.Builder --force-clean --keep-build-dirs --disable-updates --install --user build-flatpak com.github.kinten108101.Boki.json
```

Explanation:
- `flatpak run org.flatpak.Builder`: The Flatpak Builder program.
- `--force-clean`: Force delete build folder (`build-flatpak`) before building. Otherwise you'll have to delete it manually between builds.
- `--keep-build-dirs`: Force keep previous build folders in `.flatpak-builder/build`, for your debugging purposes. As a consequence, project size will increase exponentially, so be sure to frequently clean these folders.
- `--disable-updates`: Force not fetching online for dependency module changes. The only dependency module is blueprint-compiler. Otherwise, offline development won't be possible as internet connection is required for fetching.
- `--install`: Automatically install the project after build completion.
- `--user`: Will install app in userspace.
- `build-flatpak`: Name of the output build folder. This is hardcoded in .gitignore, you should not change this.
- `com.github.kinten108101.Boki.json`: Path to the input manifest file of this app for Flatpak Builder.

Application is now available to be run. Search "Boki" for the desktop shortcut, or run this command:

```sh
flatpak run com.github.kinten108101.Boki
```

### Optional

If you're using an LSP and wish to have linting (e.g. lsp-typescript).

Install the development NPM packages in this project:

```sh
yarn install
```

These packages are type declarations for the GTK and Adwaita libraries. Now you should have working type linting in your IDE.

