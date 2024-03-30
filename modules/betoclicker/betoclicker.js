register_oceloti_module({
	name: "betoclicker",
	deps: ["van", "context-menu",],
	init({ use_module, room }) {
		const van = use_module("van");

		const { div, button, img, span } = van.tags;

		const { add_menu } = use_module("context-menu");

		const pacoc = van.state(0);
		const ferark = van.state(0);
		const duende = van.state(0);
		const chino = van.state(0);

		const pacoc_clicka = div({
			id: "pacoco-clicka",
			style: `
				position: absolute;
				left: 32px;
				top: 200px;
			`
		},
			button({
				"use-native-menu": true,
				oncontextmenu: (e) => {
					e.preventDefault();
				},
				onmousedown: (e) => {
					pacoc.val +=  e.button === 0 ? 1 : -1;
				},
				style: `
					flex-direction: column;
					border-radius: 4px;
				`
			},
				img({
					draggable: false,
					src: window.PACOCO,
					alt: "",
					style: "width: 400px; height: 400px;"
				}),
				span(pacoc)
			),
		);

		const ferark_clicka = div({
			id: "ferark-clicka",
			style: `
				position: absolute;
				left: 502px;
				top: 200px;
			`
		},
			button({
				"use-native-menu": true,
				oncontextmenu: (e) => {
					e.preventDefault();
				},
				onmousedown: (e) => {
					ferark.val +=  e.button === 0 ? 1 : -1;
				},
				style: `
					flex-direction: column;
					border-radius: 4px;
				`
			},
				img({
					draggable: false,
					src: window.FERARK,
					alt: "",
					style: "width: 400px; height: 400px;"
				}),
				span(ferark)
			),
		);

		const duende_clicka = div({
			id: "duende-clicka",
			style: `
				position: absolute;
				left: 1002px;
				top: 200px;
			`
		},
			button({
				"use-native-menu": true,
				oncontextmenu: (e) => {
					e.preventDefault();
				},
				onmousedown: (e) => {
					duende.val +=  e.button === 0 ? 1 : -1;
				},
				style: `
					flex-direction: column;
					border-radius: 4px;
				`
			},
				img({
					draggable: false,
					src: window.MALVADO,
					alt: "",
					style: "width: 400px; height: 400px;"
				}),
				span(duende)
			),
		);

		const chino_clicka = div({
			id: "duende-chino",
			style: `
				position: absolute;
				left: 1602px;
				top: 200px;
			`
		},
			button({
				"use-native-menu": true,
				oncontextmenu: (e) => {
					e.preventDefault();
				},
				onmousedown: (e) => {
					chino.val +=  e.button === 0 ? 1 : -1;
				},
				style: `
					flex-direction: column;
					border-radius: 4px;
				`
			},
				img({
					draggable: false,
					src: "https://qph.cf2.quoracdn.net/main-qimg-b0c204b880556d97007c4eaac1f3224f",
					alt: "",
					style: "width: 400px; height: 400px;"
				}),
				span(chino)
			),
		);


		const existing_pacoco = document.getElementById("pacoco-clicka");
		if (existing_pacoco) {
			existing_pacoco.remove();
		}

		const existing_ferark = document.getElementById("ferark-clicka");
		if (existing_ferark) {
			existing_ferark.remove();
		}

		const existing_duende = document.getElementById("duende-clicka");
		if (existing_duende) {
			existing_duende.remove();
		}

		const existing_chino = document.getElementById("duende-chino");
		if (existing_chino) {
			existing_chino.remove();
		}

		van.add(room, pacoc_clicka);
		van.add(room, ferark_clicka);
		van.add(room, duende_clicka);
		van.add(room, chino_clicka);
	},
});