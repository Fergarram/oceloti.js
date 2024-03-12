register_oceloti_module({
	name: "arena-cards",
	deps: ["van", "arena-api"],
	init({ use_module, room, hud }) {
		const van = use_module("van");
		const { sign_in } = use_module("arena-api");

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
					
					const res = await sign_in(fields.token);

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
					"Sign In to use Are.na blocks."
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
						"add token"
					)
				)
			),
			div({
				"oceloti-dialog-messages": ""
			},
				div({
					class: "nugget"
				},
					p(
						"To get your token visit: ",
						a({
							style: "margin-left: 8px;",
							target: "_blank",
							href: "https://arena-token-gen.vercel.app/"
						},
							"suna.garden/get-token"
						)
					),
				)
			)
		);

		van.add(hud, button({
			style: `
				background: black;
				color: white;
			`,
			onclick: () => {
				van.add(document.body, dialog_el);
				dialog_el.showModal();
			}
		},
			"** are.na bag"
		));
	}
});