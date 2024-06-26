register_oceloti_module({
	name: "audio-player",
	deps: ["inventory", "van", "context-menu"],
	init({ use_module, room, room_name, next_loop }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { figure, div, button, audio, source } = van.tags;

		const THING_NAME = "audio-player";

		register_item_handler({
			icon: () => "📼",
			name: THING_NAME,
			description: ({ content, state }) => {
				return "A audio pretending to be tape.";
			},
			initializer,
			encoder,
			renderer
		});

		function renderer({ x, y, width, height, content }) {
			return div({
				"oceloti-thing": THING_NAME,
				"oceloti-state": "default",
				"oceloti-motion": "idle",
				style: `
					left: ${x - (width / 2)}px;
					top: ${y - 140}px;
					width: ${width}px;
					height: ${height}px;
				`
			},
				audio({
					controls: "true"
				},
					source({
						src: content
					}),
					"Your browser does not support the audio tag."
				)
			);
		}

		function encoder(thing) {
			const source = thing.querySelector(`source`);
			return {
				handler: THING_NAME,
				state: "default",
				width: thing.offsetWidth,
				height: thing.offsetHeight,
				content: source.src,
			};
		}

		function initializer(thing) {

		}
	}
});
