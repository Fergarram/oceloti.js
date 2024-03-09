(async () => {
	if (!van) {
		console.error("The inventory module depends on van.js");
		return;
	};

	const hud = document.getElementById("hud");
	const room = document.querySelector("[oceloti-room]");
	
	if (!room || !hud) return;

	const { div, button, img, ul, li, span } = van.tags;

	const items = [
		{
			icon: "🗒️",
			description: "A spiral notebook. Drag to rip page.",
			grid_x: 3,
			grid_y: 1,
			width: 300,
			height: 400,
			renderer: "notebook-paper",
			state: "read",
			content: ""
		},
		{
			icon: "❓",
			description: "Unknown item, requires pdf-reader renderer.",
			grid_x: 5,
			grid_y: 1,
			width: 300,
			height: 400,
			renderer: "notebook-paper",
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

	items.forEach((item) => {
		const index = (item.grid_y - 1) * 3 + (item.grid_x - 1);
  		slots[index] = item;
	});

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
					window.oceloti_menu["inventory_item"] = [
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
					];
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
			"🎒 bag"
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
			onclick: (e) => {
				e.target.classList.toggle("selected");
				show_inventory.val = !show_inventory.val;
			}
		},
			"☁️ drive"
		),
	));

	window.addEventListener("carddrop", ({ detail: { card } }) => {
		card.setAttribute("oceloti-menu", "card-menu");
		card.addEventListener("mousedown", (e) => {
			if (e.button !== 2) return;
			window.oceloti_menu["inventory_actions"] = [
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
			];
		});
	});
})();