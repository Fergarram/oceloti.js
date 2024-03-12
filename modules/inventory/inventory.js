register_oceloti_module({
	name: "inventory",
	deps: ["van", "context-menu"],
	init({ use_module, hud }) {
		const { add_menu } = use_module("context-menu");

		const item_handlers = [];

		function register_item_handler({ name, descriptor, icon, initializer, renderer }) {
			item_handlers.push({
				name, // Handler name.
				descriptor, // Function that generates item description.
				icon, // Function that returns icon.
				initializer, // Function that takes card element and initializes UI.
				renderer, // Function that takes item and returns HTMLElement node.
			});
		}

		window.addEventListener("carddrop", ({ detail: { card } }) => {
			card.setAttribute("oceloti-menu", "card-menu");
			card.addEventListener("mousedown", (e) => {
				if (e.button !== 2) return;
				add_menu("inventory_actions", [
					button({
						onclick: () => console.log("pack")
					},
						"🎒 Put away"
					),
					button({
						onclick: () => card.remove()
					},
						"🗑️ Trash card"
					),
				]);
			});
		});

		const items = [
			{
				handler: "notebook-paper",
				width: 300,
				height: 400,
				state: "read",
				content: ""
			},
			{
				handler: "pdf-reader",
				width: 300,
				height: 400,
				state: "read",
				content: ""
			}
		];

		const slots = [
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
		];

		items.forEach((item, index) => {
			// @STEP: Get icon and description here.

			// icon: "❓",
			// description: "Unknown item, requires pdf-reader handler.",

	  		slots[index] = item;
		});

		const van = use_module("van");
		const { div, button, img, ul, li, span } = van.tags;

		const show_inventory = van.state(false);

		const inventory_grid = ul({
			class: "inventory-grid",
			style: () => `
				display: ${show_inventory.val ? "grid" : "none"}
			`
		},
			slots.map(item => li({
				class: "inventory-slot",
				...(item ? {
					"oceloti-menu": "inventory-item",
					"title": item.description,
					onmousedown: (e) => {
						if (e.button !== 2) return;
						add_menu("inventory_item", [
							button({
								onclick: () => {
									const event = new CustomEvent("inventorydrop", { detail: { item } });
									window.dispatchEvent(event);
								}
							},
								"⤵️ Drop"
							),
							button({
								onclick: () => {}
							},
								"🔍 inspect"
							),
							button({
								onclick: () => {}
							},
								"🖨️ copy"
							),
							button({
								onclick: () => {}
							},
								"🗑️ Trash"
							)
						]);
					},
				} : {
					ondragover: (e) => {
						e.preventDefault();
						e.dataTransfer.dropEffect = "move";
						e.dataTransfer
					},
					ondrop: (e) => {
						e.preventDefault();
						console.log(e.dataTransfer.getData("text/plain"));
					},
				}),
			},
				span({
					"draggable": item ? "true" : "false",
					"data-value": item ? `${item.grid_x},${item.grid_y}` : null,
					class: "inventory-item emoji",
					ondragstart: (e) => {
						if (item) {
							event.dataTransfer.setData('text/plain', event.target.dataset.value);
							event.dataTransfer.effectAllowed = 'move';
						} else {
							event.preventDefault();
						}
					},
				},
					item ? item.icon : ""
				)
			))
		);

		const inventory_launcher = div({
			style: "position: relative;",
		},
			button({
				onclick: (e) => {
					e.target.classList.toggle("selected");
					show_inventory.val = !show_inventory.val;
				}
			},
				"🎒 local bag (b)"
			),
			inventory_grid
		);

		van.add(hud, inventory_launcher);

		van.add(hud, div({
			style: "position: relative;",
		},
			button({
				style: `
					background: royalblue;
					color: white;
				`,
			},
				"☁️ drive bag"
			),
		));

		return {
			item_handlers,
			register_item_handler
		}
	}
});