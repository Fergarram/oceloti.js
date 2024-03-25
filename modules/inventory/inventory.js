register_oceloti_module({
	name: "inventory",
	deps: ["van", "context-menu", "thing-manager", "dnd-manager"],
	init({ use_module, hud, room, utils: { repeat } }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_drop_handler } = use_module("dnd-manager");
		const { add_thing_to_room, register_thing_initializer } = use_module("thing-manager");
		const { button } = van.tags;

		const exports = {
			item_handlers: [],
			bags: {},
			register_item_handler({ name, icon, description, initializer, encoder, renderer }) {
				exports.item_handlers.push({
					name, // Handler name.
					icon, // Function that returns icon.
					description, // Function that generates item description.
					initializer, // Function that takes thing element and initializes UI.
					encoder, // Function that takes a thing element and returns an item object.
					renderer, // Function that takes item and returns HTMLElement node.
				});
				register_thing_initializer(name, (thing) => {
					initializer(thing);
					thing.setAttribute("oceloti-menu", "thing-menu");
					thing.addEventListener("mousedown", (e) => {
						if (e.button !== 2) return;
						add_menu("inventory_actions", [
							button({
								onclick: () => {
									const handler = thing.getAttribute("oceloti-thing");
									const compatible_handlers = exports.item_handlers.filter(h => h.name === handler);
									if (compatible_handlers.length === 0) {
										throw new Error(`Could not find registered handlers for "${handler}" but there should have been at least one.`);
									}

									const { encoder } = compatible_handlers[0];
									if (exports.add_item_to_bag("local-bag", encoder(thing))) {									
										thing.remove();
									}
								}
							},
								"🎒 Put away"
							),
							button({
								onclick: () => {}
							},
								"🖨 Make copy"
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
			create_new_bag(id, length) {
				const ids = Object.keys(exports.bags);
				if (ids.includes(id)) {
					console.error(`Bag with "${id}" id already exists.`);
					return;
				}

				exports.bags[id] = van.state(repeat(length, null));
				return exports.bags[id];
			},
			watch_bag(bag_id, callback) {
				if (!exports.bags[bag_id]) {
					console.warn(`Bag with id "${bag_id}" was not found.`);
					return;
				}

				const bag = exports.bags[bag_id];
				van.derive(() => callback(bag.val));
			},
			add_item_to_bag(bag_id, item, index = -1) {
				if (!exports.bags[bag_id]) {
					console.warn(`Bag with id "${bag_id}" was not found.`);
					return null;
				}

				const bag = exports.bags[bag_id];

				if (index === -1) {
					for (let i = 0; i < bag.val.length; i++) {
						if (bag.val[i] === null) {
							index = i;
							break;
						}
					}
				} else if (index !== -1 && bag.val[index] !== null) {
					index = -1;
					for (let i = 0; i < bag.val.length; i++) {
						if (bag.val[i] === null) {
							index = i;
							break;
						}
					}
				}

				if (index === -1) {
					alert("Bag is full.");
					return null;
				}

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
		  			return index;
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
	  			return index;
			},
			move_item_in_bag(bag_id, from, to) {
				if (!exports.bags[bag_id]) {
					throw new Error(`Bag with id "${bag_id}" was not found.`);
					return;
				}

				const bag = exports.bags[bag_id];
				const bag_copy = [...bag.val];
				const item = { ...bag.val[from] };
				bag_copy[to] = item;
				bag_copy[from] = null;
		  		bag.val = bag_copy;
			},
			drop_item_from_bag(bag_id, index, x, y) {
				if (!exports.bags[bag_id]) {
					throw new Error(`Bag with id "${bag_id}" was not found.`);
					return;
				}

				const bag = exports.bags[bag_id];
				if (bag.val[index].unknown) {
					alert("Can't drop unknown item.");
					return;
				}

				const bag_copy = [...bag.val];
				const { renderer, initializer, data } = { ...bag.val[index] };
				van.add(room, renderer({ ...data, x, y }));
				bag_copy[index] = null;
				bag.val = bag_copy;
			},
			trash_item_from_bag(bag_id, index) {
				if (!exports.bags[bag_id]) {
					throw new Error(`Bag with id "${bag_id}" was not found.`);
					return;
				}

				const bag = exports.bags[bag_id];
				const bag_copy = [...bag.val];
				bag_copy[index] = null;
				bag.val = bag_copy;
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

				let found_type = null;

				for (const type of types) {
					if (!found_type && type === "oceloti/item") {
						const item_ref = JSON.parse(e.dataTransfer.getData("oceloti/item"));
						exports.drop_item_from_bag(
							item_ref.bag_id,
							item_ref.index,
							window.scrollX + e.clientX,
							window.scrollY + e.clientY,
						);
						found_type = "oceloti/item";
						break;
					}
				}

				for (const type of types) {
					if (!found_type && (type.includes("url") || type.includes("uri"))) {
						// @FIXME: Handle links and image links
						const image_type = types.find(t => t.includes("image"));
						const alt_type = types.find(t => t === "text/plain");
						const url = e.dataTransfer.getData(alt_type);
						found_type = image_type ? "image" : "link";
						console.log(found_type, url);
						break;
					}
				}

				for (const type of types) {
					if (!found_type && type === "text/plain") {
						// @FIXME: Handle text
						found_type = "text";
						console.log("text");
						break;
					}
				}
			}
		});

		return exports;
	}
});