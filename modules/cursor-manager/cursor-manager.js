register_oceloti_module({
	name: "cursor-manager",
	deps: ["van"],
	init({ use_module, hud, are_dialogs_open }) {
		const van = use_module("van");
		const { div } = van.tags;
		const current_cursor = van.state("");
		let switch_timeout = null;

		const exports = {
			cursors: {},
			active_cursor: "",
			mouse_pos: {
				rx: 0,
				ry: 0,
				cx: 0,
				cy: 0,
			},
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
				if (exports.active_cursor) {
					const cursor_indicator_el = document.getElementById("cursor-indicator");
					cursor_indicator_el.style.opacity = "100";
					clearTimeout(switch_timeout);
					switch_timeout = setTimeout(() => cursor_indicator_el.style.removeProperty("opacity"), 1000);
				}
				exports.active_cursor = slug;
				current_cursor.val = exports.cursors[slug].icon;
				document.body.setAttribute("oceloti-cursor", slug);
			},
			is_cursor_active(slug) {
				return exports.active_cursor === slug;
			},
		};

		const cursor_indicator = div({
			id: "cursor-indicator",
		},
			div(current_cursor)
		);
		van.add(hud, cursor_indicator);

		window.addEventListener("keydown", handle_keydown);
		function handle_keydown(e) {
			// @TODO: This should be handled by a `keyboard-shortcuts` module.
			const active_element = document.activeElement;
			const is_input_focused = active_element.tagName === 'INPUT' || active_element.tagName === 'TEXTAREA';
			const is_editable_focused = active_element.hasAttribute('contenteditable');
			const menu = document.getElementById("oceloti-context-menu");

			if (is_input_focused || is_editable_focused || menu) {
				if (e.key === "Escape") {
					active_element.blur();
					e.preventDefault();
					return;
				} else {
					return;
				}
			}

			if (are_dialogs_open()) {
				return;
			}

			if (e.key === "Escape") {
				if (exports.active_cursor !== "pointer")
					exports.set_active_cursor("pointer");
				else if (exports.active_cursor === "pointer")
					exports.set_active_cursor("hand");
			}
		}

		window.addEventListener("mousemove", handle_mousemove);
		function handle_mousemove(e) {
			if (!cursor_indicator) return;
			exports.mouse_pos.cx = e.clientX;
			exports.mouse_pos.cy = e.clientY;
			cursor_indicator.style.transform = `translate3d(${exports.mouse_pos.cx}px, ${exports.mouse_pos.cy}px, 0)`;
		}

		// Default pointer cursor
		exports.register_cursor({
			name: "Pointer Cursor",
			slug: "pointer",
			icon: "👆🏼",
			description: "Pointer cursor that allows to interact or inspect things."
		});
		exports.set_active_cursor("pointer");

		return exports;
	}
});