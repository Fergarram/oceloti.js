register_oceloti_module({
	name: "notebook-paper",
	deps: ["inventory", "van", "context-menu"],
	init({ use_module, next_loop }) {
		const THING_NAME = "notebook-paper";

		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { article, div, button } = van.tags;

		register_item_handler({
			icon: () => "🗒",
			name: THING_NAME,
			description: ({ content }) => {
				if (content) return "piece of paper with text";
				else return "empty piece of paper";
			},
			initializer(thing) {
				const initial_state = thing.getAttribute("oceloti-state");
				const state = van.state(initial_state);
				const content = thing.querySelector(`[oceloti-ref="content"]`)

				thing.addEventListener("mousedown", (e) => {
					if (e.button !== 2) return;
					// @TODO: Get click position to know which line to cut and add a menu item to cut there.
					add_menu("paper_actions", [
						button({ onclick: toggle_state }, state.val === "read" ? "🔓 Unlock" : "🔒 Lock"),
					]);
				});

				content.addEventListener("keydown", async (e) => {
					await next_loop();
					// localStorage.setItem(`OCELOTI_ROOM_SNAPSHOT_${room_name}`, room.innerHTML);
				});

				function toggle_state() {
					if (state.val === "read") {
						state.val = "write";
						thing.setAttribute("oceloti-state", "write");
						content.setAttribute("contenteditable", "");
					} else {
						state.val = "read"
						thing.setAttribute("oceloti-state", "read");
						content.removeAttribute("contenteditable");
					}
				}
			},
			encoder(thing) {
				const content = thing.querySelector(`[oceloti-ref="content"]`);
				return {
					handler: THING_NAME,
					state: "read",
					width: thing.offsetWidth,
					height: thing.offsetHeight,
					content: content.outerHTML,
				};
			},
			renderer({ x, y, width, content, state }) {
				const thing_el = article({
					"oceloti-thing": THING_NAME,
					"oceloti-state": state,
					"oceloti-motion": "idle",
					style: `
						left: ${x - (width / 2)}px;
						top: ${y - 140}px;
						width: ${width}px;
					`
				},
					div({ "oceloti-ref": "content" }),
					div({ class: "decor" })
				);

				const content_html_string = content && content.includes("oceloti-ref")
					? content
					: `<div oceloti-ref="content">${content}</div>`;
				thing_el.firstElementChild.outerHTML = content_html_string;

				if (state === "read") thing_el.firstElementChild.removeAttribute("contenteditable");
				else thing_el.firstElementChild.setAttribute("contenteditable", "");

				return thing_el;
			}
		});
	}
});
