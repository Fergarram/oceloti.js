(() => {
	const room = document.querySelector("[oceloti-room]");
	if (!room) return;

	const { article, div, button, span } = van.tags;

	function ReadState({ x, y, w }, text) {
		const html = text.replaceAll("\n", "<br/>");
		const el = article({
			"oceloti-card": "notebook-paper",
			"oceloti-inner-state": "read",
			style: `
				left: ${x}px;
				top: ${y}px;
				width: ${w}px;
			`
		},
			div({
				"oceloti-ref": "content"
			})
		);
		el.firstElementChild.innerHTML = html;
		return { el, html: el.outerHTML };
	}

	function initialize_paper(card) {
		const initial_state = card.getAttribute("oceloti-inner-state");
		const state = van.state(initial_state);

		const toggle = button({
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

		// van.add(card, toggle);

		const content = card.querySelector(`[oceloti-ref="content"]`)

		content.addEventListener("mousedown", (e) => {
			if (e.button !== 2) return;
			window.oceloti_menu["paper_actions"] = [
				button({ onclick: handle_toggle }, state.val === "read" ? "📝 Write" : "👓 Read")
			];
		});

		function handle_toggle() {
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
		}
	}

	// @LAST: I think a better approach is for the inventory module to
	//        export  a register hook so that we don't use "intentorydrop".
	//        This way other modules can just register the card states
	//        and initializers.

	window.addEventListener("inventorydrop", ({ detail: { item, pos } }) => {
		if (item.renderer !== "notebook-paper")
			return;

		const note = ReadState({
			x: pos ? pos.x : window.scrollX + window.innerWidth/2,
			y: pos ? pos.y : window.scrollY + window.innerHeight/2,
			w: item.width
		},
			item.content
		);

		van.add(room, note.el);
	});

	window.addEventListener("carddrop", ({ detail: { card } }) => {
		if (card.getAttribute("oceloti-card") !== "notebook-paper")
			return;

		initialize_paper(card);
	});
})();