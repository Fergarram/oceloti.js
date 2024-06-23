register_oceloti_module({
	name: "assistant-chat",
	deps: ["inventory", "van", "context-menu"],
	init({ use_module, next_loop }) {
		const THING_NAME = "assistant-chat";

		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { article, div, button, section, header, footer } = van.tags;

		async function send_messages({ key, model, messages, max_tokens = 1024 }) {
			const models = [
				{ 'opus': 'claude-3-opus-20240229', },
				{ 'sonnet': 'claude-3-sonnet-20240229', },
				{ 'haiku': 'claude-3-haiku-20240307', },
				{ '2.1': 'claude-2.1', },
				{ '2.0': 'claude-2.0', },
				{ '1.2': 'claude-instant-1.2', },
			];

			if (!models.some(m => m[model])) {
				throw new Error(`Model "${model}" not found`);
			}

			const proxy = 'https://fergarram.deno.dev';
			const headers = {
				'x-url': 'https://api.anthropic.com/v1/messages',
				'x-api-key': key,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json',
			};
			const body = {
				model: models.find(m => m[model])[model],
				max_tokens,
				messages,
			};

			try {
				const response = await fetch(proxy, {
					method: 'POST',
					headers,
					body: JSON.stringify(body),
				});

				if (response.ok) {
					const result = await response.json();
					return result;
				} else {
					throw new Error('Request failed');
				}
			} catch (error) {
				console.error('Error when fetching Anthropic:', error);
				throw error;
			}
		}

		register_item_handler({
			icon: () => "🗨️",
			name: THING_NAME,
			description: ({ }) => {
				return "A chat with an assistant."
			},
			initializer(thing) {
				const input = thing.querySelector(".new-message .textarea");
				const send = thing.querySelector("footer button");
				const title = thing.querySelector("header .title").innerText.replaceAll(" ", "_");
				const chat = thing.querySelector(".chat");

				send.addEventListener("click", async () => {
					const key = localStorage.getItem("OCELOTI_ANTHROPIC_KEY");
					const message = input.innerText;
					if (!message || message.trim() === "") {
						return;
					}

					input.innerText = "";

					if (message.includes("/key")) {
						const key = message.replace(/\/key\s/, "");
						localStorage.setItem("OCELOTI_ANTHROPIC_KEY", key);
						return;
					}

					const messages = [];

					// get previous messages
					Array.from(chat.children).forEach((convo) => {
						const user_message = convo.firstElementChild;
						const assistant_message = convo.lastElementChild;
						messages.push({
							role: "user",
							content: user_message.innerText
						});
						messages.push({
							role: "assistant",
							content: assistant_message.innerText
						});
					});

					messages.push({
						role: "user",
						content: message
					});

					const args = {
						key,
						model: "haiku",
						messages
					};

					console.log(args)

					const response = await send_messages(args);

					const reply = response.content[0].text;

					chat.appendChild(section({
						class: "convo"
					},
						div({ class: "you" }, message),
						div({ class: "them" }, reply)
					));
				});

				input.addEventListener("keydown", (e) => {
					if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
						send.click();
					}
				});
			},
			encoder(thing) {
				return {
					handler: THING_NAME,
					state: "default",
					width: thing.offsetWidth,
					height: thing.offsetHeight,
					content: ""
				};
			},
			renderer({ x, y, width, content, state }) {
				const thing_el = article({
					"oceloti-thing": THING_NAME,
					"oceloti-state": state,
					"oceloti-motion": "idle",
					style: `
						left: ${x - (width / 2)}px;
						top: ${y - 140}px;
						width: ${width}px;
					`
				},
					header(
						div({
							class: "title",
							contenteditable: true
						},
							"Untitled conversation"
						),
					),
					div({
						class: "chat"
					},
						// section({
						// 	class: "convo"
						// },
						// 	div({ class: "you" }, "lorem ipsum dolor sit amet"),
						// 	div({ class: "them" }, "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua"),
						// )
					),
					footer({},
						div({
							class: "new-message"
						},
							div({ class: "textarea", contenteditable: true }),
						),
						button({}, "Send")
					),
				);
				return thing_el;
			}
		});
	}
});
