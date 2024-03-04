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

	const inventory_launcher = div({
		style: "position: relative;",
	},
		button({
			onclick: (e) => {
				e.target.classList.toggle("selected");
			}
		},
			img({
				src: "../assets/icons/backpack.svg",
				alt: ""
			}),
			"backpack"
		),
		div({
			class: "inventory-grid"
		},
			slots.map(slot => div({ class: "inventory-slot" }))
		)
	);

	van.add(hud, inventory_launcher);

})();