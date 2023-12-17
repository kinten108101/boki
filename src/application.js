import Adw from 'gi://Adw';

import { Window } from './window.js';

export function Application() {
	const application = new Adw.Application({
		application_id: 'com.github.kinten108101.Boki',
	});

  	application.connect('activate', () => {
    	const mainWindow = Window(application);
	    mainWindow.present();
  	});
  
	return application;
}
