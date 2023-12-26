interface = [
	'ui/preferences.ui',
	'ui/window.ui',
]

interface_files = files(interface)

UI = ''
foreach x : interface
	UI = ''.join([UI, '<file>'])
	UI = ''.join([UI, x])
	UI = ''.join([UI, '</file>'])
endforeach

icons = []
subdir('icons')

ICONS = ''
foreach x : icons
	ICONS = ''.join([ICONS, '<file alias="'])
	ICONS = ''.join([ICONS, x])
	ICONS = ''.join([ICONS, '">icons/'])
	ICONS = ''.join([ICONS, x])
	ICONS = ''.join([ICONS, '</file>'])
endforeach

data_manifest = configure_file(
	input:  'gresources.data.xml',
	output: 'com.github.kinten108101.Boki.data.xml',
	configuration: {
		'UI': UI,
		'ICONS': ICONS,
	},
)

data_resource = gnome.compile_resources(
	'com.github.kinten108101.Boki.data',
	data_manifest,
	dependencies: interface_files,
	gresource_bundle: true,
	install: true,
	install_dir: get_option('datadir') / 'com.github.kinten108101.Boki',
)

configure_file(
	input: 'gresources.metainfo.xml',
	output: 'com.github.kinten108101.Boki.metainfo.xml',
	copy: true,
	install_dir: get_option('datadir') / 'metainfo'
)

configure_file(
	input: 'app.desktop',
	output: 'com.github.kinten108101.Boki.desktop',
	copy: true,
	install_dir: get_option('datadir') / 'applications'
)

logo_path = 'app.svg'

if get_option('buildtype') == 'debug'
  logo_path = 'app-devel.svg'
endif

configure_file(
  input: logo_path,
  output: 'com.github.kinten108101.Boki.svg',
  install_dir: get_option('datadir') / 'icons' / 'hicolor' / 'scalable' / 'apps',
  copy: true,
)


configure_file(
  configuration : {
  		'DATA_DIR': get_option('datadir'),
		},
  input : 'app.service',
  output : 'com.github.kinten108101.Boki.service',
  install : true,
  install_dir : get_option('datadir') / 'dbus-1' / 'services',
)

configure_file(
	input: 'gresources.gschema.xml',
	output: 'com.github.kinten108101.Boki.gschema.xml',
	copy: true,
	install_dir: get_option('datadir') / 'glib-2.0' / 'schemas',
)
