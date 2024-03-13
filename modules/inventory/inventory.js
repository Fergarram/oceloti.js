register_oceloti_module({
	name: "inventory",
	deps: ["van", "context-menu"],
	init({ use_module, hud }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");

		const item_handlers = [];

		function register_item_handler({ name, icon, description, initializer, renderer }) {
			item_handlers.push({
				name, // Handler name.
				icon, // Function that returns icon.
				description, // Function that generates item description.
				initializer, // Function that takes card element and initializes UI.
				renderer, // Function that takes item and returns HTMLElement node.
			});
		}

		const slots = van.state([
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
		]);

		function move_item_in_bag(from, to) {
			const slots_copy = [...slots.val];
			const item = { ...slots.val[from] };
			slots_copy[to] = item;
			slots_copy[from] = null;
	  		slots.val = slots_copy;
		}

		function add_item_to_bag(bag, item, index) {
			const compatible_handlers = item_handlers.filter(h => h.name === item.handler);
			if (compatible_handlers.length === 0) {
				const slots_copy = [...slots.val];
				slots_copy[index] = {
	  				icon: "❓",
	  				description: `Unknown item, requires "${item.handler}" handler.`,
	  				data: item
	  			};
	  			slots.val = slots_copy;
	  			return;
			}

			// @TODO: Have a way to select or configure a default handler.
			const { icon, description, initializer, renderer } = compatible_handlers[0]
			const slots_copy = [...slots.val];
			slots_copy[index] = {
  				icon: icon(),
  				description: description(item),
  				initializer,
  				renderer,
  				data: item
  			};
  			slots.val = slots_copy;
		}

		// @STEP: Register a dnd handler so that whenever an item or known drop type is dropped we can take care of that from here.

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

		const { div, button, img, ul, li, span } = van.tags;

		const show_inventory = van.state(false);

		function Slot(slot, index) {
			const attrs = {
				index,
				class: "inventory-slot",
			};
			if (slot) {
				attrs["oceloti-menu"] = "inventory-item";
				attrs["title"] = slot.description;
				attrs["onmousedown"] = (e) => {
					if (e.button !== 2) return;
					add_menu("inventory_item", [
						button({
							onclick: () => {
								// @STEP: Use item renderer to add element node to room.
								// const event = new CustomEvent("inventorydrop", { detail: { item } });
								// window.dispatchEvent(event);
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
				}
			} else {
				attrs["ondragover"] = (e) => {
					e.preventDefault();
					if (!e.dataTransfer.types.includes("oceloti/item")) {
						e.dataTransfer.effectAllowed = "none";
						return;
					}
					e.target.classList.add("dragover");
				};
				attrs["ondragleave"] = (e) => {
					e.preventDefault();
					if (!e.dataTransfer.types.includes("oceloti/item")) {
						e.dataTransfer.effectAllowed = "none";
						return;
					}
					e.target.classList.remove("dragover");
				};
				attrs["ondrop"] = (e) => {
					e.preventDefault();
					if (e.dataTransfer.types.includes("oceloti/item")) {
						const slot = JSON.parse(e.dataTransfer.getData("oceloti/item"));
						const to = Number(e.currentTarget.getAttribute("index"));
						move_item_in_bag(slot.index, to);
					}
				};
			}
			return li(
				attrs,
				span({
					"draggable": slot ? "true" : "false",
					style: !slot ? "display: none;" : "",
					class: "inventory-item emoji",
					ondragstart: (e) => {
						e.dataTransfer.setData('oceloti/item', JSON.stringify({
							index,
							...slot,
						}));
						e.dataTransfer.effectAllowed = 'move';
					},
				},
					slot ? slot.icon : ""
				)
			);
		}

		function InventoryGrid(list) {
			return ul({
				class: "inventory-grid",
				style: () => `
					display: ${show_inventory.val ? "grid" : "none"}
				`
			},
				...list.map( (slot, i) => Slot(slot, i))
			);
		}

		van.add(hud, div({
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
			() => InventoryGrid(slots.val)
		));

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
			register_item_handler,
			add_item_to_bag
		}
	}
});