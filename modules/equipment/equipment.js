register_oceloti_module({
	name: "equipment",
	deps: ["van"],
	init({ use_module, hud }) {
		const van = use_module("van");

		const { div, button, img } = van.tags;

		const slots = [
			"🔍","","🤚","✏️","🪄"," ", " ", " "
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
			style: `
				display: flex;
				align-items: center;
				gap: 6px;
				position: fixed;
				left: 12px;
				bottom: 12px;
			`,
		},
			div({
				style: "position: relative;"
			},
				button({
					onclick: (e) => {
						
					}
				},
					"🔌 equipment (e)"
				),
				equipment_grid
			),
			div({
				style: "position: relative;"
			},
				button({
					onclick: (e) => {
						e.target.classList.toggle("selected");
						show_equipment.val = !show_equipment.val;
					}
				},
					"🖱️ cursors (c)"
				),
			),
			div({
				style: "position: relative;"
			},
				button({
					onclick: (e) => {
					}
				},
					"📔 item handbook (h)"
				),
			)
		);

		van.add(hud, equipment_launcher);
	}	
});