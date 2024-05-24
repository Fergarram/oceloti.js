register_oceloti_module({
	name: "module-editor",
	deps: ["inventory", "van"],
	init({ get_oceloti, use_module, room, room_name, next_loop, module_list }) {
		const van = use_module("van");
		const { get_item_handler } = use_module("inventory");
		const { div, button, dialog, h2, label, textarea, input, form } = van.tags;

		window.addEventListener("load", () => {

			window.open_module_editor = open_module_editor;
			window.open_module_installer = open_module_installer;

			const css = `font-weight: bold;`;
			console.log("Call %copen_module_editor()", css, "in the console to show the UI.");

			function InstallerDialog() {
				return dialog({
					"oceloti-dialog": "module-installer",
					onclose: (e) => e.target.remove(),
				},
					form({
						method: "dialog",
						onsubmit: handle_submit,
					},
						h2("Module installer"),
						label({
							for: "module-installer-field-name"
						},
							"Module name"
						),
						input({
							required: "true",
							name: "module",
							id: "module-installer-field-name"
						}),
						label({
							for: "module-installer-field-styles"
						},
							"Styles"
						),
						textarea({
							name: "styles",
							id: "module-installer-field-styles"
						}),
						label({
							for: "module-installer-field-script"
						},
							"Script"
						),
						textarea({
							name: "script",
							id: "module-installer-field-script"
						}),
						button("install and run")
					),
				);
			}

			function handle_submit(e) {
				e.preventDefault();

				const dialog_el = document.querySelector(`[oceloti-dialog="module-installer"]`);
				if (!dialog_el) return;

				const form = new FormData(e.target);
				const fields = {};
				for (const [key, value] of form.entries()) {
					fields[key] = value;
				}

				// @TODO: Check if module exists

				const style_el = document.createElement("style");
				const script_el = document.createElement("script");

				style_el.setAttribute("oceloti-module", fields["module"]);
				script_el.setAttribute("oceloti-module", fields["module"]);
				
				style_el.innerHTML = fields["styles"];
				script_el.innerHTML = fields["script"];

				const module_list_el = document.querySelector('meta[name="oceloti-module-list"]');
				const module_list_string = module_list_el.getAttribute("content");
				module_list_el.setAttribute("content", module_list_string + "\n\t\t" + fields["module"]);

				const oceloti = get_oceloti();
				oceloti.module_list.push(fields["module"]);
				
				van.add(document.head, style_el);
				van.add(document.body, script_el);

				toggle_dialog(false);
			}

			function toggle_dialog(visibility) {
				const dialog_el = document.querySelector(`[oceloti-dialog="module-installer"]`);
				if (!dialog_el) return;
				if (visibility) dialog_el.showModal();
				else dialog_el.close();
			}

			function open_module_editor() {
				const list_el = document.getElementById("module-list-viewer");
				if (!list_el) return;
				list_el.style.display = "flex";
			}

			function open_module_installer() {
				van.add(document.body, InstallerDialog());
				toggle_dialog(true);
			}

			function place_code_paper(content) {
				const data = {
					handler: "codepad",
					width: 300,
					height: 400,
					state: "read",
					content,
				};
				const available_handlers = get_item_handler(data.handler);
				const x = window.scrollX + window.innerWidth / 2;
				const y = window.scrollY + window.innerHeight / 2;
				van.add(room, available_handlers[0].renderer({ ...data, x, y }));
			}

			const add_module_button = button({
				style: "margin-bottom: 1rem;",
				onclick: open_module_installer
			},
				"install module"
			);

			const module_list_viewer = div({
				id: "module-list-viewer"
			},
				add_module_button,
				module_list.map((mod) => {
					const script_el = document.querySelector(`script[oceloti-module="${mod}"]`);
					const code = `${script_el.innerHTML.replaceAll("\n\t\t", "\n").trim()}`;
					return button({ onclick: () => place_code_paper(code) }, mod);
				})
			);

			van.add(hud, module_list_viewer);
		});
	}
});