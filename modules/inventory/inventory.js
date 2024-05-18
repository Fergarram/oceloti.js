register_oceloti_module({
	name: "inventory",
	deps: ["van", "context-menu", "thing-manager", "dnd-manager"],
	init({ use_module, hud, room, repeat }) {
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
									// @TODO: Show all registered bags as context sub-menu.
									if (exports.add_item_to_bag("local-bag", encoder(thing)) !== null) {
										thing.remove();
									}
								}
							},
								"🎒 Put away"
							),
							button({
								onclick: () => {
									const copy = thing.cloneNode(true);
									if (copy.id) {
										copy.id = copy.id + crypto.randomUUID();
									}
									copy.style.left = `${Number(copy.style.left.replace("px", "")) + 24}px`;
									copy.style.top = `${Number(copy.style.top.replace("px", "")) + 24}px`;
									van.add(room, copy);
								}
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
			get_item_handler(name) {
				return exports.item_handlers.filter(h => h.name === name);
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

		function create_temp_image(src, callback) {
			const tmp_img = document.createElement("img");
			tmp_img.onload = () => callback(tmp_img);
			tmp_img.src = src;
		}

		register_drop_handler({
			invoking_module: "inventory",
			dnd_types: ["oceloti/item", "text/x-moz-url", "text/plain", "text/html", "Files"],
			callback: async (e) => {
				const files = e.dataTransfer.files;
				const types = e.dataTransfer.types;

				if (files.length > 0) {
					for (let file of files) {
						console.log(file.type);
						if (file.type.includes("image")) {
							const reader = new FileReader();
							reader.onload = (event) => {
								const base64_url = event.target.result;
								create_temp_image(base64_url, (tmp_img) => {
									const width = tmp_img.naturalWidth;
									const height = tmp_img.naturalHeight;
									const data = {
										handler: "image-print",
										width: width > 400 ? 400 : width,
										height: width > 400 ? (400 * height) / width : height,
										state: "default",
										content: base64_url,
									};
									const available_handlers = exports.get_item_handler(data.handler);
									// @TODO: If no handler available, add to bag and notify.
									const x = window.scrollX + e.clientX;
									const y = window.scrollY + e.clientY;
									van.add(room, available_handlers[0].renderer({ ...data, x, y }));
								});
							};
							reader.readAsDataURL(file);
							break;
						}
						if (file.type.includes("video")) {
							const reader = new FileReader();
							reader.onload = (event) => {
								const base64_url = event.target.result;
								const data = {
									handler: "video-player",
									width: 400,
									height: 300,
									state: "default",
									content: base64_url,
								};
								const available_handlers = exports.get_item_handler(data.handler);
								// @TODO: If no handler available, add to bag and notify.
								const x = window.scrollX + e.clientX;
								const y = window.scrollY + e.clientY;
								van.add(room, available_handlers[0].renderer({ ...data, x, y }));
							};
							reader.readAsDataURL(file);
							break;
						}
						if (file.type.includes("audio")) {
							const reader = new FileReader();
							reader.onload = (event) => {
								const base64_url = event.target.result;
								const data = {
									handler: "audio-player",
									width: 400,
									height: 300,
									state: "default",
									content: base64_url,
								};
								const available_handlers = exports.get_item_handler(data.handler);
								// @TODO: If no handler available, add to bag and notify.
								const x = window.scrollX + e.clientX;
								const y = window.scrollY + e.clientY;
								van.add(room, available_handlers[0].renderer({ ...data, x, y }));
							};
							reader.readAsDataURL(file);
							break;
						}
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
					if (!found_type && type.includes("text/html")) {
						const html_string = e.dataTransfer.getData("text/html");
						const parser = new DOMParser();
						const doc = parser.parseFromString(html_string, 'text/html');
						const img_element = doc.querySelector('img');

						if (img_element) {
							const image_uri = img_element.getAttribute('src');
							found_type = "image";

							create_temp_image(image_uri, (tmp_img) => {
								const width = tmp_img.naturalWidth;
								const height = tmp_img.naturalHeight;
								const data = {
									handler: "image-print",
									width: width > 400 ? 400 : width,
									height: width > 400 ? (400 * height) / width : height,
									state: "default",
									content: image_uri,
								};
								const available_handlers = exports.get_item_handler(data.handler);
								// @TODO: If no handler available, add to bag and notify.
								const x = window.scrollX + e.clientX;
								const y = window.scrollY + e.clientY;
								van.add(room, available_handlers[0].renderer({ ...data, x, y }));
							});
							break;
						}
					}

					if (!found_type && type.includes("url")) {
						// @FIXME: Handle links and image links
						const image_type = types.find(t => t.includes("image"));
						const alt_type = types.find(t => t === "text/plain");
						const url = e.dataTransfer.getData(alt_type);
						found_type = image_type ? "image" : "link";
						if (found_type === "image") {
							const image_uri = e.dataTransfer.getData("application/x-moz-file-promise-url");
							create_temp_image(image_uri, (tmp_img) => {
								const width = tmp_img.naturalWidth;
								const height = tmp_img.naturalHeight;
								const data = {
									handler: "image-print",
									width: width > 400 ? 400 : width,
									height: width > 400 ? (400 * height) / width : height,
									state: "default",
									content: image_uri,
								};
								const available_handlers = exports.get_item_handler(data.handler);
								// @TODO: If no handler available, add to bag and notify.
								const x = window.scrollX + e.clientX;
								const y = window.scrollY + e.clientY;
								van.add(room, available_handlers[0].renderer({ ...data, x, y }));
							});
						} else {
							const url = e.dataTransfer.getData("text/plain");
							const data = {
								handler: "notebook-paper",
								width: 400,
								height: 400,
								state: "read",
								content: `<a href="${url}">${url}</a>`,
							};
							const available_handlers = exports.get_item_handler(data.handler);
							// @TODO: If no handler available, add to bag and notify.
							const x = window.scrollX + e.clientX;
							const y = window.scrollY + e.clientY;
							van.add(room, available_handlers[0].renderer({ ...data, x, y }));
						}

						break;
					}
				}

				for (const type of types) {
					if (!found_type && type === "text/plain") {
						found_type = "text";
						const data = {
							handler: "notebook-paper",
							width: 400,
							height: 400,
							state: "read",
							content: e.dataTransfer.getData("text/plain"),
						};
						const available_handlers = exports.get_item_handler(data.handler);
						// @TODO: If no handler available, add to bag and notify.
						const x = window.scrollX + e.clientX;
						const y = window.scrollY + e.clientY;
						van.add(room, available_handlers[0].renderer({ ...data, x, y }));
						break;
					}
				}
			}
		});

		return exports;
	}
});