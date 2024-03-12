{
	const oceloti = {
		room: document.querySelector("[oceloti-room]"),
		hud: document.getElementById("hud"),
		css_modules: document.querySelector("style[oceloti-modules]")
			.getAttribute("oceloti-modules").trim().split(/\s+/),
		css_assets:  document.querySelector("style[oceloti-assets]")
			.getAttribute("oceloti-assets").trim().split(/\s+/),
		js_modules: document.querySelector("script[oceloti-modules]")
			.getAttribute("oceloti-modules").trim().split(/\s+/),
		active_modules: {},
		utils: {}
	};

	// @DEBUG
	window.oceloti = oceloti;

	oceloti.utils.are_dialogs_open = function() {
		const dialogs = document.querySelectorAll('dialog');
		return Array.from(dialogs).some(dialog => dialog.open);
	}

	window.register_oceloti_module = function({ name, deps, init }) {
		if (!oceloti || !oceloti.room || !oceloti.hud) {
			throw new Error("Oceloti was not setup correctly:", oceloti);
		}

		if (!oceloti.js_modules.includes(name)) {
			throw new Error(`Trying to register undeclared module "${name}". Available modules:`, oceloti.js_modules);
		}

		if (oceloti.active_modules[name]) {
			throw new Error(`Module "${name}" has already been registered.`);
		}

		deps.forEach(mod => {
			if (!oceloti.js_modules.includes(mod)) {
				console.error(`"${name}" module requires "${mod}" but it wasn't included in room.`);
				return;
			}

			if (!oceloti.active_modules[mod]) {
				console.error(`"${name}" module requires "${mod}" to work but it hasn't been initialized.`);
				return;
			}
		});

		oceloti.active_modules[name] = init({
			room: oceloti.room,
			hud: oceloti.hud,
			utils: oceloti.utils,
			use_module(mod) {
				return oceloti.active_modules[mod];
			},
		}) || {};
	}
}