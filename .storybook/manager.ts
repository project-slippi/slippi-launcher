import { addons } from "@storybook/addons";

addons.setConfig({
	isFullscreen: false,
	showNav: true,
	showPanel: true,
	panelPosition: 'bottom',
	enableShortcuts: true,
	isToolshown: true,
	selectedPanel: undefined,
	initialActive: 'sidebar',
	sidebar: {
		showRoots: false,
		collapsedRoots: ['other'],
	},
	toolbar: {
		title: { hidden: false, },
		zoom: { hidden: false, },
		eject: { hidden: false, },
		copy: { hidden: false, },
		fullscreen: { hidden: false, },
	},
});
