register_oceloti_module({
	name: "suna-garden",
	deps: ["van", "arena-api"],
	init({ use_module, room, hud }) {
		const van = use_module("van");
		const { sign_in, sign_out, get_user } = use_module("arena-api");
		const { dialog, form, fieldset, input, p, div, span, a, button, img, h2 } = van.tags;

		const is_authed = van.state(get_user() ? true : false);

		function LoginForm() {
			return div({
				style: `
					display: flex;
					flex-direction: column;
					gap: 1rem;
					width: 90vw;
					max-width: 500px;
				`
			},
				form({
					method: "dialog",
					onsubmit: handle_submit,
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
							span({ style: "margin-right: 8px;" }, "To get your token visit: "),
							a({
								target: "_blank",
								href: "https://arena-token-gen.vercel.app/"
							},
								"arena-token-gen.vercel.app"
							)
						),
					)
				)
			);
		}

		function ArenaDialog() {
			return dialog({
				"oceloti-dialog": "arena-token",
				onclose: (e) => e.target.remove(),
				style: `
					display: flex;
					flex-direction: column;
					gap: 1rem;
				`,
			},
				() => is_authed.val ? AccountPanel() : LoginForm()
			);
		}

		function AccountPanel() {
			return div({
				style: `
					display: flex;
					flex-direction: column;
					gap: 20px;
					width: 90vw;
					max-width: 256px;
				`	
			},
				img({
					style: `
						max-width: 100%;
						width: 100%;
						height: auto;
						border-radius: 8px;
					`,
					src: get_user().avatar_image.display,
					alt: "arena profile photo"
				}),
				div({
					style: `
						display: flex;
						align-items: center;
						justify-content: space-between;
					`
				},
					h2({ style: `font-size: 16px` }, get_user().full_name),
					p(`[${get_user().badge}]`)
				),
				div({
					style: `
						display: grid;
						grid-template-columns: 1fr 1fr;
						align-items: center;
						gap: 8px;
					`
				},
					button({
						style: "justify-content: center;",
						onclick: () => toggle_dialog(false)
					},
						"close"
					),
					button({
						style: "justify-content: center; background-color: #ff9191",
						onclick: () => {
							is_authed.val = false;
							sign_out();
							toggle_dialog(false);
						}
					},
						"log out"
					),
				),
			);
		}

		function toggle_dialog(visibility) {
			const dialog_el = document.querySelector(`[oceloti-dialog="arena-token"]`);
			if (!dialog_el) return;
			if (visibility) dialog_el.showModal();
			else dialog_el.close();
		}

		async function handle_submit(e) {
			e.preventDefault();
			const dialog_el = document.querySelector(`[oceloti-dialog="arena-token"]`);
			if (!dialog_el) return;

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
				is_authed.val = true;
				van.add(messages_el, div({ 
					"class": "nugget nugget-success"
				},
					p(res.message),
					button({ onclick: () => toggle_dialog(false)}, 
						"Close"
					)
				));
			}
		}

		van.add(hud, button({
			style: `
				position: fixed;
				right: 12px;
				top: 12px;
				background: black;
				color: white;
			`,
			onclick: () => {
				van.add(document.body, ArenaDialog());
				toggle_dialog(true);
			}
		},
			() => is_authed.val ? get_user().full_name : "** sign in"
		));
	}
});