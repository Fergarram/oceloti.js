register_oceloti_module({
	name: "betoclicker",
	deps: ["van", "context-menu",],
	init({ use_module, room }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { div, button, img, span } = van.tags;

		const THING_NAME = "clicker-card";

		register_item_handler({
			icon: () => "🪪",
			name: THING_NAME,
			description: ({ content, state }) => {
				return "A clicker card.";
			},
			initializer,
			encoder,
			renderer
		});


		function initializer(thing) {
			const clicks_el = thing.querySelector(`[oceloti-ref="clicks"]`);
			const button_el = thing.querySelector(`[oceloti-ref="button"]`);
			const click_counter = van.state(Number(clicks_el.innerText));
			button_el.addEventListener("contextmenu", (e) => e.preventDefault());
			button_el.addEventListener("mousedown", (e) => {
				click_counter.val +=  e.button === 0 ? 1 : -1;
				clicks_el.innerText = click_counter.val;
			});
		}

		function encoder(thing) {
			const clicks_el = thing.querySelector(`[oceloti-ref="clicks"]`);
			return {
				handler: THING_NAME,
				state: "default",
				width: thing.offsetWidth,
				height: thing.offsetHeight,
				content: clicks_el.innerText,
			};
		}

		function renderer({ x, y, content }) {
			return div({
				"oceloti-thing": THING_NAME,
				"oceloti-state": "default",
				"oceloti-motion": "idle",
				style: `
					left: ${x - 200}px;
					top: ${y - 140}px;
					width: 400px;
				`
			},
				div({
					"oceloti-ref": "button",
					"use-native-menu": true,
					style: `
						flex-direction: column;
						border-radius: 4px;
					`
				},
					img({
						"use-native-menu": true,
						draggable: false,
						src: window.PACOCO,
						alt: "",
						style: "width: 100%; height: 100%;"
					}),
					span({
						"oceloti-ref": "clicks"
					}, content)
				),
			);
		}
	},
});
