register_oceloti_module({
	name: "image-print",
	deps: ["inventory", "van", "context-menu"],
	init({ use_module, room, room_name, next_loop }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { figure, div, button, img } = van.tags;

		const THING_NAME = "image-print";

		register_item_handler({
			icon: () => "🖼️",
			name: THING_NAME,
			description: ({ content, state }) => {
				return "An image printed on a fake piece of paper.";
			},
			initializer,
			encoder,
			renderer
		});

		function renderer({ x, y, width, height, content }) {
			return figure({
				"oceloti-thing": THING_NAME,
				"oceloti-inner-state": "default",
				"oceloti-thing-state": "idle",
				style: `
					left: ${x - (width / 2)}px;
					top: ${y - 140}px;
					width: ${width}px;
					height: ${height}px;
				`
			},
				img({
					draggable: false,
					src: content,
					alt: "",
				})
			);
		}

		function encoder(thing) {
			const image = thing.querySelector(`img`);
			return {
				handler: THING_NAME,
				state: "default",
				width: thing.offsetWidth,
				height: thing.offsetHeight,
				content: image.src,
			};
		}

		function initializer(thing) {
			thing.addEventListener("mousedown", (e) => {
				if (e.button !== 2) return;
				// @TODO: Get click position to know which line to cut and add a menu item to cut there.
				add_menu("image_actions", [
					button({ onclick: () => set_wallpaper(thing) }, "🖼 Use as wallpaper"),
				]);
			});
		}

		function set_wallpaper(thing) {
			const el = thing.firstElementChild;
			room.style.backgroundSize = `${el.offsetWidth}px ${el.offsetHeight}px`;
			room.style.backgroundImage = `url(${el.src})`;
		}
	}
});