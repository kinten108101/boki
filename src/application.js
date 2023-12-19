import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import { Window } from './window.js';

export function Application() {
	const application = new Adw.Application({
		application_id: 'com.github.kinten108101.Boki',
	});

	const quit = new Gio.SimpleAction({
		name: 'quit',
	});
	quit.connect('activate', () => {
		application.quit();
	});
	application.add_action(quit);

  	application.connect('activate', () => {
    	const mainWindow = Window(application);
	    mainWindow.present();
  	});
  
	return application;
}
