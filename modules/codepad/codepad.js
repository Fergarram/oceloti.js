register_oceloti_module({
	name: "codepad",
	deps: ["inventory", "van", "context-menu"],
	init({ use_module, room, room_name, next_loop }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { article, div, button, pre, textarea } = van.tags;

		const THING_NAME = "codepad";

		register_item_handler({
			icon: () => "頁",
			name: THING_NAME,
			description: ({ content, state }) => {
				return "A piece of code";
			},
			initializer,
			encoder,
			renderer
		});

		function renderer({ x, y, width, content }) {
			const el = article({
				"oceloti-thing": THING_NAME,
				"oceloti-inner-state": "read",
				"oceloti-thing-state": "idle",
				style: `
					left: ${x - (width / 2)}px;
					top: ${y - 140}px;
					width: ${width}px;
					height: ${width}px;
				`
			},
				textarea({ "oceloti-ref": "content" }, content)
			);

			return el;
		}

		function encoder(thing) {
			const content = thing.querySelector(`[oceloti-ref="content"]`);
			return {
				handler: THING_NAME,
				state: "read",
				width: thing.offsetWidth,
				height: thing.offsetHeight,
				content: content.innerText,
			};
		}

		function initializer(thing) {

		}
	}
});