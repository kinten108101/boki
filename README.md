# Boki

Boki is a Steam Workshop downloader client for the GNOME desktop.

## Development

Build and install the app:

```sh
yarn run flatpak:install
```

Application is now available to be run:

```sh
yarn run flatpak:run
```

### Optional

If you're using an LSP and wish to have linting (e.g. lsp-typescript).

Install the development NPM packages in this project:

```sh
yarn install
```

These packages are type declarations for the GTK and Adwaita libraries. Now you should have working type linting in your IDE.

