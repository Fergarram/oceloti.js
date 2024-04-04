register_oceloti_module({
	name: "cell-editor",
	deps: ["van", "context-menu",],
	init({ use_module, room, repeat }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { div, button, img, span, input, textarea, label } = van.tags;

		const THING_NAME = "cell-editor";

		register_item_handler({
			icon: () => "🧫",
			name: THING_NAME,
			description: ({ content, state }) => {
				return "A cell rule definition.";
			},
			initializer,
			encoder,
			renderer
		});


		function initializer(thing) {
			
		}

		function encoder(thing) {
			return {
				handler: THING_NAME,
				state: "default",
				width: thing.offsetWidth,
				height: thing.offsetHeight,
				content: "",
			};
		}

		function renderer({ x, y, content }) {
			return div({
				"oceloti-thing": THING_NAME,
				"oceloti-inner-state": "default",
				"oceloti-thing-state": "idle",
				style: `
					left: ${x - 200}px;
					top: ${y - 140}px;
					width: fit-content;
					height: fit-content;
				`
			},
				div({
					class: "header"
				},
					div({
						class: "title",
					}, "Untitled reaction"),
					div({
						class: "neighborhood-slider",
					},
						label("Neighborhood size", ),
						input({
							type: "range",
							min: 0,
							max: 5,
						}),
					),
					textarea({
						rows: 10
					}),
				),
				div({
					class: "program-sheet"
				},
					div({
						class: "layers current"
					},
						repeat(3).map((_, l) => div({
							class: "grid-wrapper"
						},
							div(`Condition (L${l})`),
							div({
								class: "grid"
							},
								repeat(25).map((_, i) => div({
									class: `cell`
								},
									input({
										type: "text",
										minlength: "1",
										maxlength: "3",
									})
								))
							)
						))
					),
					div({
						class: "layers next"
					},
						repeat(3).map((_, l) => div({
							class: "grid-wrapper"
						},
							div(`Next Self (L${l})`),
							div({
								class: "grid"
							},
								repeat(25, 0).map((_, i) => div({
									class: i !== 12 ? "empty" : "cell",
								},
									i === 12 ? 
									input({
										type: "text",
										minlength: "1",
										maxlength: "3",
									}) : div()
								))
							)
						))
					),
				),
			);
		}
	},
});