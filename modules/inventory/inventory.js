(async () => {
	if (!van) {
		console.error("The inventory module depends on van.js");
		return;
	};

	const hud = document.getElementById("hud");
	const room = document.querySelector("[oceloti-room]");
	
	if (!room || !hud) return;

	const { div, button, img } = van.tags;

	const slots = [
		1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,
		1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16
	];

	const show_inventory = van.state(false);

	const inventory_grid = div({
		class: "inventory-grid",
		style: () => `
			display: ${show_inventory.val ? "grid" : "none"}
		`
	},
		slots.map(slot => div({
			"oceloti-menu": "inventory-slot",
			class: "inventory-slot",
			onmousedown: (e) => {
				if (e.button !== 2) return;
				window.oceloti_menu_items = [
					button({ onclick: () => console.log("tello") }, "test")
				];
			},
		}))
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
			"🎒 backpack"
		),
		inventory_grid
	);

	van.add(hud, inventory_launcher);

	const all_cards = document.querySelectorAll("[oceloti-card]");
	if (all_cards) {
		Array.from(all_cards).forEach((card) => {
			// @LAST: I need to create a global hook that allows me to do custom stuff when a card is mounted.
			card.setAttribute("oceloti-menu", "card-menu");
			card.addEventListener("mousedown", (e) => {
				if (e.button !== 2) return;
				window.oceloti_menu_items = [
					button({
						onclick: () => console.log("pack")
					},
						"🎒 Put away"
					),
					button({
						onclick: () => card.remove()
					},
						"♻️ Trash card"
					),
				];
			})
		});
	}
})();