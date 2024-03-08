(async () => {
	if (!van) {
		console.error("The equipment module depends on van.js");
		return;
	};

	const hud = document.getElementById("hud");
	const room = document.querySelector("[oceloti-room]");
	
	if (!room || !hud) return;

	const { div, button, img } = van.tags;

	const slots = [
		"📃"," ","🤚","✏️",
	];

	const show_equipment = van.state(false);

	const equipment_grid = div({
		class: "equipment-grid",
		style: () => `
			display: ${show_equipment.val ? "grid" : "none"}
		`
	},
		slots.map(slot => div({
			"oceloti-menu": "equipment-slot",
			class: "equipment-slot",
			onmousedown: (e) => {
				if (e.button !== 2) return;
			},
		},
			div({ class: "equipment-item emoji" }, slot)
		))
	);

	const equipment_launcher = div({
		style: "position: relative;",
	},
		button({
			onclick: (e) => {
				e.target.classList.toggle("selected");
				show_equipment.val = !show_equipment.val;
			}
		},
			"🔌 equipment"
		),
		equipment_grid
	);

	van.add(hud, equipment_launcher);
})();