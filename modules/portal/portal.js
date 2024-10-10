register_oceloti_module({
	name: "portal",
	deps: ["inventory", "van", "cursor-manager", "context-menu", "arena-api"],
	init({ use_module }) {
		const THING_NAME = "portal";

		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { is_cursor_active } = use_module("cursor-manager");
		const { query } = use_module("arena-api");
		const { figure, div, img, form, input, button, a } = van.tags;

		function handle_search_submit(e) {
			e.preventDefault();
			const form = e.target;
			const channel = form.elements.channel.value;
			const token = localStorage.getItem("ARENA_TOKEN");
			query({
				endpoint: `/channels/${channel}`,
				token: token ? token : "",
			}).then((data) => {
				let image_src = data.contents[data.contents.length - 1].image.display.url;
				const thing = form.closest("[oceloti-thing=portal]");
				const wrapper = thing.querySelector(".inner-bevel");
				wrapper.innerHTML = "";

				van.add(
					wrapper,
					a({
						draggable: false,
						href: `https://suna.garden/${channel}`,
						style: `
							display: block;
							width: 100%;
							height: 100%;
						`
					},
						img({
							src: image_src,
							class: "image",
							alt: `Enter ${channel}`,
							title: `Enter ${channel}`,
							width: "250",
							height: "250",
							draggable: false,
						})
					)
				);
			});
		}

		register_item_handler({
			icon: () => "🚪",
			name: THING_NAME,
			description: ({ content }) => {
				if (content) return `A portal to ${content}`;
				else return "A portal to another room.";
			},
			initializer(thing) {},
			encoder(thing) {
				return {
					handler: THING_NAME,
					state: "default",
					width: thing.offsetWidth,
					height: thing.offsetHeight,
					content: "todo",
				};
			},
			renderer({ x, y, width, height, content, state }) {
				const thing_el = figure(
					{
						"oceloti-thing": THING_NAME,
						"oceloti-state": content ? "loading" : "empty",
						"oceloti-motion": "idle",
						"oceloti-plug-slug": content,
						style: `
							left: ${x - width / 2}px;
							top: ${y - 140}px;
							width: ${width}px;
							height: ${height}px;
						`,
					},
					content
						? div()
						: div(
								{ class: "outer-bevel" },
								div(
									{ class: "flat-surface" },
									div(
										{ class: "inner-bevel" },
										form(
											{
												onsubmit: handle_search_submit,
											},
											input({
												name: "channel",
												required: true,
												type: "text",
												placeholder: "Enter a room slug",
											}),
											button("Search"),
										),
									),
								),
							),
				);

				return thing_el;
			},
		});
	},
});
