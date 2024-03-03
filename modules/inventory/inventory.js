(async () => {
	if (!van) {
		console.error("The inventory module depends on van.js");
		return;
	};

	const hud = document.getElementById("hud");
	const room = document.querySelector("[oceloti-room]");
	
	if (!room || !hud) return;

	const { dialog, form, fieldset, input, p, div, a, button } = van.tags;

	const dialog_el = dialog({
		"oceloti-dialog": "arena-token",
		onclose: (e) => e.target.remove(),
		style: `
			display: flex;
			flex-direction: column;
			gap: 1rem;
		`,
	},
		form({
			method: "dialog",
			onsubmit: async (e) => {
				e.preventDefault();
				const form = new FormData(e.target);
				const fields = {};
				for (const [key, value] of form.entries()) {
					fields[key] = value;
				}
				
				const res = await arena_sign_in(fields.token);

				const messages_el = dialog_el.querySelector("[oceloti-dialog-messages]");

				messages_el.innerHTML = "";
				
				if (res.status === "error") {
					van.add(messages_el, div({
						"class": "nugget nugget-error"
					}, 
						p(res.message)
					));
					return;
				}

				if (res.status === "success") {
					van.add(messages_el, div({ 
						"class": "nugget nugget-success"
					},
						p(res.message),
						button({ onclick: () => dialog_el.close()}, 
							"Close"
						)
					));
				}
			}
		},
			p({
				style: "margin-bottom: 1rem;",
			},
				"To get your token visit: ",
				a({
					target: "_blank",
					href: "https://arena-token-gen.vercel.app/"
				},
					"suna.garden/get-token"
				)
			),
			fieldset({
				style: `
					display: flex;
					gap: 0.5rem;
				`
			},
				input({
					"name": "token",
					"type": "text",
					"required": "true",
					"style": "width: 100%;",
					"autocomplete": "off",
					// @TODO: Fix this absurd bug... wtf.
					onclick: (e) => e.target.focus()
				}),
				button({
					style: `
						width: fit-content;
						white-space: nowrap;
					`,
					"type": "submit"
				},
					"Submit"
				)
			)
		),
		div({ "oceloti-dialog-messages": "" })
	);

	van.add(room, button({
		style: "left: 300px; top: 300px; position: absolute;",
		onclick: () => {
			van.add(document.body, dialog_el);
			dialog_el.showModal();
		}
	},
		"* Sign In"
	));
})();