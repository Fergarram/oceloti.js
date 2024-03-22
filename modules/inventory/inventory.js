register_oceloti_module({
	name: "inventory",
	deps: ["van", "context-menu", "thing-manager", "dnd-manager"],
	init({ use_module, hud, room }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_drop_handler } = use_module("dnd-manager");
		const { add_thing_to_room, register_thing_initializer } = use_module("thing-manager");
		const { button } = van.tags;

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
						console.log(e);
						if (e.button !== 2) return;
						add_menu("inventory_actions", [
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
					const bag_copy = [...bag.val];
					bag_copy[index] = {
						unknown: true,
		  				icon: "❓",
		  				description: `Unknown item, requires "${item.handler}" handler.`,
		  				data: item
		  			};
		  			bag.val = bag_copy;
		  			return;
				}

				// @TODO: Have a way to select or configure a default handler.
				const { icon, description, initializer, renderer } = compatible_handlers[0]
				const bag_copy = [...bag.val];
				bag_copy[index] = {
					unknown: false,
	  				icon: icon(),
	  				description: description(item),
	  				initializer,
	  				renderer,
	  				data: item
	  			};
	  			bag.val = bag_copy;
			},
			move_item_in_bag(bag, from, to) {
				const bag_copy = [...bag.val];
				const item = { ...bag.val[from] };
				bag_copy[to] = item;
				bag_copy[from] = null;
		  		bag.val = bag_copy;
			},
			drop_item_from_bag(bag, index, x, y) {
				const { renderer, initializer, data } = { ...bag.val[index] };
				van.add(room, renderer({ ...data, x, y }));
			}
		};

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
							console.log(item_ref);
							alert("Can't drop unknown item.");
							break;
						}
						// @LAST: item_ref should have a bag reference.
						console.log(item_ref)
						// drop_item_from_bag(
						// 	slots,
						// 	item_ref.index,
						// 	window.scrollX + e.clientX,
						// 	window.scrollY + e.clientY,
						// );
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