register_oceloti_module({
	name: "cell-editor",
	deps: ["van", "context-menu",],
	init({ use_module, room, room_name, repeat, next_loop }) {
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

		function encoder(thing) {
			return {
				handler: THING_NAME,
				state: "default",
				width: thing.offsetWidth,
				height: thing.offsetHeight,
				content: "",
			};
		}

		function initializer(thing) {
			const slider = thing.querySelector(".neighborhood-slider input");
			slider.value = slider.dataset.value;

			const update_grids = async () => {
				const neighborhood_size = Number(slider.dataset.value);
				const side_length = (1 + ( neighborhood_size * 2 ));
				const cells_length = side_length ** 2;

				const left_grids = Array.from(thing.querySelectorAll(".current .grid"));
				left_grids.forEach(grid => {
					grid.outerHTML = CellGridLayout(side_length, cells_length, false).outerHTML;
				});

				const right_grids = Array.from(thing.querySelectorAll(".next .grid"));
				right_grids.forEach(grid => {
					grid.outerHTML = CellGridLayout(side_length, cells_length, true).outerHTML;
				});

				await next_loop();
				localStorage.setItem(`OCELOTI_ROOM_SNAPSHOT_${room_name}`, room.innerHTML);
			};

			slider.addEventListener("input", (e) => {
				slider.setAttribute("data-value", slider.value);
				update_grids();
			});

			const add_layer_button = thing.querySelector('[ref="add-layer-button"]');
			const program_sheet = thing.querySelector('.program-sheet');

			add_layer_button.addEventListener("click", () => {
				if (program_sheet.classList.contains("empty")) {
					program_sheet.innerHTML = "";
					program_sheet.classList.remove("empty");
				}
				const neighborhood_size = Number(slider.dataset.value);
				const side_length = (1 + ( neighborhood_size * 2 ));
				const cells_length = side_length ** 2;
				van.add(program_sheet, GridPair(0, side_length, cells_length));
			});

			update_grids();
		}

		function CellGridLayout(side_length, cells_length, is_next = false) {
			const center_cell = Math.floor(cells_length / 2);
			return div({
				class: "grid",
				style: () => `
					grid-template-columns: repeat(${side_length}, 32px);
					grid-template-rows: repeat(${side_length}, 32px);
				`
			},
				repeat(cells_length, 0).map((_, i) => div({
					class: !is_next ? "cell" : i !== center_cell ? "empty" : "cell",
				},
					!is_next
						? input({
							type: "text",
							minlength: "1",
							maxlength: "3",
						})
						: i === center_cell
							? input({
								type: "text",
								minlength: "1",
								maxlength: "3",
							})
							: div()
				))
			);
		};

		function GridPair(layer_index, side_length, cells_length) {
			return div({
				class: "layers"
			},
				div({
					class: "grid-wrapper current"
				},
					div(`Condition (L${layer_index})`),
					CellGridLayout(side_length, cells_length)
				),
				div({
					class: "grid-wrapper next"
				},
					div(`Next Self (L${layer_index})`),
					CellGridLayout(side_length, cells_length, true)
				)
			);
		}

		function renderer({ x, y, content }) {
			const neighborhood_size = 1;
			const side_length = (1 + ( neighborhood_size * 2 ));
			const cells_length = side_length ** 2;
			const layers = [];

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
					input({
						class: "title",
						type: "text",
						placeholder: "Untitled reaction sheet"
					}),
					div({
						class: "neighborhood-slider",
					},
						label("Neighborhood size", ),
						input({
							type: "range",
							min: 1,
							max: 3,
							"data-value": 1
						}),
					),
					textarea({
						rows: 10
					}),
				),
				div({
					class: `program-sheet ${layers.length === 0 ? "empty" : ""}`
				},
					layers.map((l) => GridPair(l, side_length, cells_length))
				),
				div({
					class: "footer",
				},
					button({
						"ref": "add-layer-button"
					},
						"Add layer pair"
					)
				)
			);
		}
	},
});