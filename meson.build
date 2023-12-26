project(
	'boki',
	license: ['MIT'],
)

i18n = import('i18n')
gnome = import('gnome')
fs = import('fs')

gjs = dependency('gjs-1.0', version: '>=1.76.0', required: true)
gjs_console = gjs.get_variable(pkgconfig: 'gjs_console')
gtk4 = dependency('gtk4', version: '>=4.10.3', required: true)
adw1 = dependency('libadwaita-1', version: '>=1.3.2', required: true)
blueprint_compiler = find_program('blueprint-compiler', version: '>=0.8.1', required: true)

subdir('data')
subdir('src')
subdir('po')

gnome.post_install(
	glib_compile_schemas: true,
	update_desktop_database: true,
	gtk_update_icon_cache: true,
)
