<img style="vertical-align: middle;" src="data/resources/app.svg" width="120" height="120" align="left">

# Boki

Steam Workshop downloader client for GNOME.

With Boki, you can download add-on/mod files from your favorite games on Steam.

The logo is inspired by an artwork by Tony Zenitium (Source: [here](https://zenitium.artstation.com/projects/3dm1XE) and [here](https://www.artstation.com/artwork/3dm1XE)).

<p>
	<img src="data/resources/preview-1.png" width="32%">
	<img src="data/resources/preview-2.png" width="32%">
	<img src="data/resources/preview-3.png" width="32%">
</p>


## Development

This project uses Flatpak, an app container technology. Your Linux distro should have this installed by default, otherwise you'll have to install it manually.

Install Flatpak Builder, required to build Flatpak apps:

```sh
flatpak install org.flatpak.Builder
```

Build and install the app using the `scripts/flatpak-install.sh` script. You can inspect the file's content to see what's running.

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

## About

"Boki" derives from the names of two fictional characters "Bocchi" and "Kita" from the popular Japanese comic series/animated show "Bocchi the Rock!".
