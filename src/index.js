#!@GJS@ -m

// @ts-expect-error
import { setConsoleLogDomain } from "console";
import GLib from 'gi://GLib';

imports.package.init({
  name: 'com.github.kinten108101.Boki',
  version: '@VERSION@',
  prefix: '@PREFIX@',
  libdir: '@LIBDIR@',
});

let buildtype = '@BUILD_TYPE@';
globalThis.is_devel = (buildtype === 'debug');
let built_for_flatpak = '@BUILD_FOR_FLATPAK@';
globalThis.is_built_for_flatpak = (built_for_flatpak === 'True');

setConsoleLogDomain('boki');

pkg.initGettext();

const getMain = new GLib.MainLoop(null, false);
// @ts-expect-error
import('resource:///com/github/kinten108101/Boki/js/main.js')
  .then(mod => {
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      getMain.quit();
      imports.package.run(mod);
      return GLib.SOURCE_REMOVE;
    });
  }).catch(logError);
  
getMain.run();
