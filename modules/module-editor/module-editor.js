register_oceloti_module({
	name: "module-editor",
	deps: ["inventory", "van", "context-menu"],
	init({ use_module, room, room_name, next_loop, module_list }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler, get_item_handler } = use_module("inventory");
		const { article, div, button, span } = van.tags;

		const THING_NAME = "module-editor";

		register_item_handler({
			icon: () => "部",
			name: THING_NAME,
			description: ({ content, state }) => "Module",
			initializer,
			encoder,
			renderer
		});

		function renderer({ x, y, width, content }) {
			const html = content && content.includes("oceloti-ref")
				? content
				: `<div oceloti-ref="content">${content}</div>`;
			const el = article({
				"oceloti-thing": THING_NAME,
				"oceloti-inner-state": "read",
				"oceloti-thing-state": "idle",
				style: `
					left: ${x - (width / 2)}px;
					top: ${y - 140}px;
					width: ${width}px;
				`
			},
				div({ "oceloti-ref": "content" }),
				div({ class: "decor" })
			);
			el.firstElementChild.outerHTML = html;
			el.firstElementChild.removeAttribute("contenteditable");

			return el;
		}

		function encoder(thing) {
			const content = thing.querySelector(`[oceloti-ref="content"]`);
			return {
				handler: THING_NAME,
				state: "default",
				width: thing.offsetWidth,
				height: thing.offsetHeight,
				content: content.outerHTML,
			};
		}

		function initializer(thing) {

		}

		window.addEventListener("load", () => {
			window.open_module_editor = () => {
				const list_el = document.getElementById("module-list-viewer");
				if (!list_el) return;
				list_el.style.display = "flex";
			};

			const css = `font-weight: bold;`;
			console.log("Call %copen_module_editor()%c in the console to show the UI.", css);

			const place_code_paper = (content) => {
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
			};

			const module_list_viewer = div({
				id: "module-list-viewer"
			},
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