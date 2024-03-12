(async () => {
	const hud = document.getElementById("hud");
	if (!hud) return;

	if (!van) {
		console.error("The inventory module depends on van.js");
		return;
	};

	const { dialog, button, p, div, a } = van.tags;

	const hud_button = button({
		onclick: save
	}, "💾 Save");

	// van.add(hud, hud_button);

	window.addEventListener("keydown", handle_keydown);

	function handle_keydown(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === "s") {
			e.preventDefault();
			save();
		}
	}

	function save() {
		let dom_content = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;

		if (hud) {
			let hud_contents = hud.innerHTML;
			dom_content = dom_content.replace(hud_contents, "");
		}

		const dialog_el = dialog({
			"oceloti-dialog": "save-to-file",
			onclose: (e) => e.target.remove()
		},
			div({
				style: `
					display: flex;
					align-items: center;
					justify-content: center;
					flex-direction: column;
					gap: 0.75rem;
				`
			},
				p(`Right-click download button to "save as".`),
				a({ class: "button" }, "⬇️ Download")
			)
		);

		van.add(document.body, dialog_el)
		
		setTimeout(() => {
			const blob = new Blob([dom_content], { type: 'text/html' });
			const url = URL.createObjectURL(blob);
			const dialog_el = document.querySelector(`[oceloti-dialog="save-to-file"]`);
			const link_el = dialog_el.querySelector("a");
			link_el.href = url;
			link_el.download = `${document.title}.html`;
			
			dialog_el.showModal();
		}, 0);
	}
})();