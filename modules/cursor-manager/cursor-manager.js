register_oceloti_module({
	name: "cursor-manager",
	deps: ["van"],
	init({ use_module, hud }) {
		const van = use_module("van");

		const { div } = van.tags;
		const current_cursor = van.state("");

		const exports = {
			cursors: {},
			active_cursor: "",
			register_cursor({ slug, icon, name, description }) {
				exports.cursors[slug] = {
					name,
					icon,
					slug,
					description,
				};
			},
			set_active_cursor(slug) {
				if (!exports.cursors[slug]) {
					console.error("Trying to activate a non-existent cursor:", slug);
					return;
				}
				exports.active_cursor = slug;
				current_cursor.val = exports.cursors[slug].icon;
				document.body.setAttribute("oceloti-cursor", slug);
			},
			is_cursor_active(slug) {
				return exports.active_cursor === slug;
			},
		};

		// Default pointer cursor
		exports.register_cursor({
			name: "Pointer Cursor",
			slug: "pointer",
			icon: "↖️",
			description: "Pointer cursor that allows to interact or inspect things."
		});
		exports.set_active_cursor("pointer");

		window.addEventListener("keydown", handle_keydown);
		function handle_keydown(e) {
			// @TODO: This should be handled by a `keyboard-shortcuts` module.
			const active_element = document.activeElement;
			const is_input_focused = active_element.tagName === 'INPUT' || active_element.tagName === 'TEXTAREA';
			const is_editable_focused = active_element.hasAttribute('contenteditable');

			if (is_input_focused || is_editable_focused) {
				if (e.key === "Escape") {
					active_element.blur();
					e.preventDefault();
				} else {
					return;
				}
			}

			if (e.key === "Escape") {
				if (exports.active_cursor !== "pointer")
					exports.set_active_cursor("pointer");
				else if (exports.active_cursor === "pointer")
					exports.set_active_cursor("hand");
			}
		}

		const cursor_indicator = div({
			style: "position: fixed; bottom: 12px; left: 12px; font-size: 24px; pointer-events: none;"
		},
			current_cursor
		);
		van.add(hud, cursor_indicator)

		return exports;
	}
});