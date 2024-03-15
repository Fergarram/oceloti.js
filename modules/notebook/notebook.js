register_oceloti_module({
	name: "notebook",
	deps: ["inventory", "van", "context-menu"],
	init({ use_module }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler, add_item_to_bag } = use_module("inventory");

		register_item_handler({
			icon: () => "🗒️",
			name: "notebook-paper",
			description: ({ content, state }) => {
				if (content) return "A piece of paper with text.";
				else return "An empty piece of paper.";
			},
			initializer,
			renderer
		});

		// @DEBUG
		window.addEventListener("load", () => {
			const items = [
				{
					handler: "notebook-paper",
					width: 300,
					height: 400,
					state: "read",
					content: ""
				},
				{
					handler: "pdf-reader",
					width: 300,
					height: 400,
					state: "read",
					content: ""
				},
				{
					handler: "notebook-paper",
					width: 300,
					height: 400,
					state: "read",
					content: "Hello world"
				},
			];

			items.forEach((item, index) => {
				add_item_to_bag("local", item, index);
			});
		});

		function renderer(item) {
			switch(item.state) {
				case "read":
					return handle_read_state(item);
			}
		}

		const { article, div, button, span } = van.tags;

		function handle_read_state({ x, y, width, content }) {
			const html = content.replaceAll("\n", "<br/>");
			const el = article({
				"oceloti-thing": "notebook-paper",
				"oceloti-inner-state": "read",
				style: `
					left: ${x - (width / 2)}px;
					top: ${y - 140}px;
					width: ${width}px;
				`
			},
				div({
					"oceloti-ref": "content"
				})
			);
			el.firstElementChild.innerHTML = html;
			return el;
		}

		function initializer(thing) {
			const initial_state = thing.getAttribute("oceloti-inner-state");
			const state = van.state(initial_state);

			const toggle = button({
				"oceloti-ref": "toggle",
				style: `
					position: absolute;
					right: 6px;
					bottom: 6px;
				`,
				onclick: handle_toggle
			},
				span({ class: "emoji" }, () => state.val === "read" ? "📝" : "👓")
			);

			// van.add(thing, toggle);

			const content = thing.querySelector(`[oceloti-ref="content"]`)

			content.addEventListener("mousedown", (e) => {
				if (e.button !== 2) return;
				add_menu("paper_actions", [
					button({ onclick: handle_toggle }, state.val === "read" ? "📝 Write" : "👓 Read")
				]);
			});

			function handle_toggle() {
				if (state.val === "read") {
					state.val = "write";
					thing.setAttribute("oceloti-inner-state", "write");
					thing.setAttribute("oceloti-thing-state", "active");
					content.setAttribute("contenteditable", "");
				} else {
					state.val = "read"
					thing.setAttribute("oceloti-inner-state", "read");
					thing.setAttribute("oceloti-thing-state", "idle");
					content.removeAttribute("contenteditable");
				}
			}
		}
	}
});