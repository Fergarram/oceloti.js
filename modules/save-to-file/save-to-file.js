register_oceloti_module({
	name: "save-to-file",
	deps: ["van"],
	init({ use_module, hud, room, room_name, next_loop }) {

		const van = use_module("van");

		const { dialog, button, p, div, a } = van.tags;

		const hud_button = button({
			onclick: save
		}, "💾 Save");

		const unsaved_msg = div({
			style: `
				display: none;
				position: fixed;
				bottom: 0;
				right: 0;
				color: white;
				background: black;
				padding: 4px 6px;
				user-select: none;
		-webkit-user-select: none;
			`
		},
			"unsaved changes"
		);

		van.add(hud, unsaved_msg);

		window.addEventListener("load", () => {
			const room_snapshot = localStorage.getItem(`OCELOTI_ROOM_SNAPSHOT_${room_name}`);
			const room_initial_snapshot = localStorage.getItem(`OCELOTI_ROOM_SNAPSHOT_initial_${room_name}`);
			if (room_snapshot !== room_initial_snapshot) {
				unsaved_msg.style.display = "block";
			}
		});

		window.addEventListener("keydown", handle_keydown);

		function handle_keydown(e) {
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				save();
			}
		}

		async function save() {
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

			await next_loop();
			
			const blob = new Blob([dom_content], { type: 'text/html' });
			const url = URL.createObjectURL(blob);
			const link_el = dialog_el.querySelector("a");
			link_el.href = url;
			link_el.download = `${document.title}.html`;
			
			dialog_el.showModal();
		}

		// const room_snapshot = localStorage.getItem(`OCELOTI_ROOM_SNAPSHOT_${room_name}`);
		// if (room_snapshot) {
			// localStorage.setItem(`OCELOTI_ROOM_SNAPSHOT_initial_${room_name}`, room.innerHTML);
			// room.innerHTML = room_snapshot;
		// }
	}
});