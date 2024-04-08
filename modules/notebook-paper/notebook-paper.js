register_oceloti_module({
	name: "notebook-paper",
	deps: ["inventory", "van", "context-menu"],
	init({ use_module, room, room_name, next_loop }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { article, div, button, span } = van.tags;

		const THING_NAME = "notebook-paper";

		register_item_handler({
			icon: () => "🗒️",
			name: THING_NAME,
			description: ({ content, state }) => {
				if (content) return "A piece of paper with text.";
				else return "An empty piece of paper.";
			},
			initializer,
			encoder,
			renderer
		});

		function renderer(item) {
			switch(item.state) {
				case "read":
				case "write":
					return handle_read_state(item);
			}
		}

		function encoder(thing) {
			const content = thing.querySelector(`[oceloti-ref="content"]`);
			return {
				handler: THING_NAME,
				state: "read",
				width: thing.offsetWidth,
				height: thing.offsetHeight,
				content: content.outerHTML,
			};
		}

		function handle_read_state({ x, y, width, content }) {
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
				onclick: toggle_state
			},
				span({ class: "emoji" }, () => state.val === "read" ? "📝" : "👓")
			);

			// van.add(thing, toggle);

			const content = thing.querySelector(`[oceloti-ref="content"]`)

			content.addEventListener("mousedown", (e) => {
				if (e.button !== 2) return;
				add_menu("paper_actions", [
					button({ onclick: toggle_state }, state.val === "read" ? "📝 Write" : "👓 Read")
				]);
			});

			content.addEventListener("keydown", async (e) => {
				await next_loop();
				localStorage.setItem(`OCELOTI_ROOM_SNAPSHOT_${room_name}`, room.innerHTML);
			});

			function toggle_state() {
				if (state.val === "read") {
					state.val = "write";
					thing.setAttribute("oceloti-inner-state", "write");
					content.setAttribute("contenteditable", "");
				} else {
					state.val = "read"
					thing.setAttribute("oceloti-inner-state", "read");
					content.removeAttribute("contenteditable");
				}
			}
		}
	}
});