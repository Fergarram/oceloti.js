(() => {
	const room = document.querySelector("[oceloti-room]");
	if (!room) return;

	// NOTEBOOK PAPER

	const { article, div, button, span } = van.tags;

	const paper_content = div({
		"oceloti-ref": "content"
	});

	const paper = article({
		"oceloti-card": "notebook-paper",
		"oceloti-inner-state": "read",
		style: `
			left: 3800px;
			top: 3800px;
			width: 300px;
		`
	},
		paper_content
	);

	van.add(room, paper);

	window.addEventListener("carddrop", ({ detail: { card } }) => {

		const toggle_ref = paper.querySelector(`[oceloti-ref="toggle"]`);
		if (toggle_ref) {
			toggle_ref.remove();
		}

		const state = van.state("read");

		function handle_toggle() {
			const content = card.querySelector(`[oceloti-ref="content"]`)

			if (state.val === "read") {
				state.val = "write";
				card.setAttribute("oceloti-inner-state", "write");
				card.setAttribute("oceloti-card-state", "active");
				content.setAttribute("contenteditable", "");
			} else {
				state.val = "read"
				card.setAttribute("oceloti-inner-state", "read");
				card.setAttribute("oceloti-card-state", "idle");
				content.removeAttribute("contenteditable");
			}

			content.addEventListener("mousedown", (e) => {
				if (e.button !== 2) return;
				window.oceloti_menu["paper_actions"] = [
					button({ onclick: handle_toggle }, () => state.val === "read" ? "📝 Write" : "👓 Read")
				];
			});
		}

		const paper_toggle = button({
			"oceloti-ref": "toggle",
			style: `
				position: absolute;
				right: 6px;
				bottom: 6px;
			`,
			onclick: handle_toggle
		},
			span({ class: "emoji" }, () => state.val === "read" ? "📝" : "👓")
		);

		van.add(card, paper_toggle);

		window.oceloti_menu["paper_actions"] = [
			button({ onclick: handle_toggle }, () => state.val === "read" ? "📝 Write" : "👓 Read")
		];
	});

	// IMAGE PRINT
})();