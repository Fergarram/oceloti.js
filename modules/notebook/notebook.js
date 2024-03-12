register_oceloti_module({
	name: "notebook",
	deps: ["inventory", "van"],
	init({ use_module }) {
		const van = use_module("van");
		const { register_item_handler } = use_module("inventory");

		register_item_handler({
			icon: () => "🗒️",
			name: "notebook-paper",
			descriptor: ({ content, state }) => {
				if (content) return "A piece of paper with text.";
				else return "An empty piece of paper.";
			},
			initializer,
			renderer
		});

		function renderer(item) {
			switch(item.state) {
				case "read":
					return handle_read_state(item);
			}
		}

		const { article, div, button, span } = van.tags;

		function handle_read_state({ x, y, w, content }) {
			const html = content.replaceAll("\n", "<br/>");
			const el = article({
				"oceloti-card": "notebook-paper",
				"oceloti-inner-state": "read",
				style: `
					left: ${x}px;
					top: ${y}px;
					width: ${w}px;
				`
			},
				div({
					"oceloti-ref": "content"
				})
			);
			el.firstElementChild.innerHTML = html;
			return { el };
		}

		function initializer(card) {
			const initial_state = card.getAttribute("oceloti-inner-state");
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

			// van.add(card, toggle);

			const content = card.querySelector(`[oceloti-ref="content"]`)

			content.addEventListener("mousedown", (e) => {
				if (e.button !== 2) return;
				window.oceloti_menu["paper_actions"] = [
					button({ onclick: handle_toggle }, state.val === "read" ? "📝 Write" : "👓 Read")
				];
			});

			function handle_toggle() {
				if (state.val === "read") {
					state.val = "write";
					card.setAttribute("oceloti-inner-state", "write");
					card.setAttribute("oceloti-card-state", "active");
					content.setAttribute("contenteditable", "");
				} else {
					state.val = "read"
					card.setAttribute("oceloti-inner-state", "read");
					card.setAttribute("oceloti-card-state", "idle");
					content.removeAttribute("contenteditable");
				}
			}
		}
	}
});