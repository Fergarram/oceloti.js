register_oceloti_module({
	name: "inventory",
	deps: ["van", "context-menu", "dnd-manager", "thing-manager"],
	init({ use_module, hud, room }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_drop_handler } = use_module("dnd-manager");
		const { add_thing_to_room, register_thing_initializer } = use_module("thing-manager");

		const exports = {
			item_handlers: [],
			register_item_handler({ name, icon, description, initializer, renderer }) {
				exports.item_handlers.push({
					name, // Handler name.
					icon, // Function that returns icon.
					description, // Function that generates item description.
					initializer, // Function that takes thing element and initializes UI.
					renderer, // Function that takes item and returns HTMLElement node.
				});
				register_thing_initializer(name, (thing) => {
					initializer(thing);
					thing.setAttribute("oceloti-menu", "thing-menu");
					thing.addEventListener("mousedown", (e) => {
						if (e.button !== 2) return;
						add_menu("inventory_actions", [
							button({
								onclick: () => console.log("pack")
							},
								"🎒 Put away"
							),
							button({
								onclick: () => thing.remove()
							},
								"🗑️ Trash thing"
							),
						]);
					});
				});
			},
			add_item_to_bag(bag, item, index) {
				const compatible_handlers = exports.item_handlers.filter(h => h.name === item.handler);
				if (compatible_handlers.length === 0) {
					const slots_copy = [...slots.val];
					slots_copy[index] = {
						unknown: true,
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
					unknown: false,
	  				icon: icon(),
	  				description: description(item),
	  				initializer,
	  				renderer,
	  				data: item
	  			};
	  			slots.val = slots_copy;
			},
			move_item_in_bag(from, to) {
				const slots_copy = [...slots.val];
				const item = { ...slots.val[from] };
				slots_copy[to] = item;
				slots_copy[from] = null;
		  		slots.val = slots_copy;
			},
			drop_item_from_bag(bag, index, x, y) {
				const { renderer, initializer, data } = { ...slots.val[index] };
				van.add(room, renderer({ ...data, x, y }));
			}
		};

		const slots = van.state([
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
		]);

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
								console.log(slot)
								exports.drop_item_from_bag(
									"local",
									index, 
									window.scrollX + window.innerWidth / 2,
									window.scrollY + window.innerHeight / 2
								);
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
						exports.move_item_in_bag(slot.index, to);
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

		register_drop_handler({
			invoking_module: "inventory",
			dnd_types: ["oceloti/item", "text/x-moz-url", "text/plain", "Files"],
			callback: async (e) => {
				const files = e.dataTransfer.files;
				const types = e.dataTransfer.types;

				if (files.length > 0) {
					for (let file of files) {
						// @FIXME: Handle files
						console.log(file.type);
					}
					return;
				}

				for (const type of types) {
					if (type === "oceloti/item") {
						const item_ref = JSON.parse(e.dataTransfer.getData("oceloti/item"));
						if (item_ref.unknown) {
							alert("Can't drop unknown item.");
							break;
						}
						exports.drop_item_from_bag("local", item_ref.index, e.clientX, e.clientY);
						break;
					}
					
					if (type.includes("url")) {
						// @FIXME: Handle links and image links
						const image_type = types.find(t => t.includes("image"));
						const alt_type = types.find(t => t === "text/plain");
						const url = e.dataTransfer.getData(alt_type);
						console.log(image_type ? "image" : "link", url);
						break;
					}

					if (type === "text/plain") {
						// @FIXME: Handle text
						console.log("text");
						break;
					}
				}
			}
		});

		return exports;
	}
});