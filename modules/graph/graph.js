register_oceloti_module({
	name: "graph",
	deps: ["inventory", "van", "cursor-manager", "context-menu"],
	init({ use_module, next_loop }) {
		const THING_NAME = "graph";

		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { is_cursor_active } = use_module("cursor-manager");
		const { figure, div, input } = van.tags;

		register_item_handler({
			icon: () => "📊",
			name: THING_NAME,
			description: ({ content }) => {
				const [label, value] = content.split(":");
				return `${label} graph with ${value} value.`;
			},
			initializer(thing) {
				const slider_el = thing.querySelector("[oceloti-ref=slider]");
				const bar_el = thing.querySelector("[oceloti-ref=bar]");
				const label_el = thing.querySelector("[oceloti-ref=label]");
				const input_el = thing.querySelector("input");

				const observer = new MutationObserver((mutations) => {
					mutations.forEach((mutation) => {
						if (mutation.type === "attributes") {
							const name = mutation.attributeName.replace("oceloti-plug-", "");
							console.log(name);

							if (name === "value") {
								const label = thing.getAttribute("oceloti-plug-label");
								const new_val = Number(thing.getAttribute(mutation.attributeName));
								label_el.innerText = `${label}: ${new_val.toFixed(1)}%`;
								bar_el.style.height = `${Math.abs(new_val)}%`;
								bar_el.style.bottom = new_val < 0 ? "unset" : "0";
								bar_el.style.top = new_val < 0 ? "100%" : "unset";
							}

							if (name === "label") {
								const val = Number(thing.getAttribute("oceloti-plug-value"));
								const label = thing.getAttribute("oceloti-plug-label");
								label_el.innerText = `${label}: ${val.toFixed(1)}%`;
								input_el.value = label;
							}
						}
					});
				});

				observer.observe(thing, {
					attributes: true,
					attributeFilter: ["oceloti-plug-value", "oceloti-plug-label"],
				});

				input_el.addEventListener("blur", (e) => {
					const new_label = input_el.value;
					thing.setAttribute("oceloti-plug-label", new_label);
				});

				input_el.addEventListener("keydown", (e) => {
					if (e.key === "Enter") {
						input_el.blur();
					}
				});

				slider_el.addEventListener("mousedown", (e) => {
					if (!is_cursor_active("pointer")) return;
					if (e.button !== 0) return;

					const rect = slider_el.getBoundingClientRect();
					const min = rect.top;
					const max = rect.bottom;
					const update_value = (e) => {
						const new_value = 100 - ((e.clientY - min) / (max - min)) * 100;
						thing.setAttribute("oceloti-plug-value", new_value);
					};
					update_value(e);
					const move = (e) => {
						update_value(e);
					};
					const stop = () => {
						document.removeEventListener("mousemove", move);
						document.removeEventListener("mouseup", stop);
					};
					document.addEventListener("mousemove", move);
					document.addEventListener("mouseup", stop);
				});
			},
			encoder(thing) {
				return {
					handler: THING_NAME,
					state: "default",
					width: thing.offsetWidth,
					height: thing.offsetHeight,
					content: "todo",
				};
			},
			renderer({ x, y, width, height, content, state }) {
				const [label, value] = content.split(":");
				const thing_el = figure(
					{
						"oceloti-thing": THING_NAME,
						"oceloti-state": state,
						"oceloti-motion": "idle",
						"oceloti-plug-label": label,
						"oceloti-plug-value": value,
						style: `
							left: ${x - width / 2}px;
							top: ${y - 140}px;
							width: ${width}px;
							height: ${height}px;
						`,
					},
					div({
							style: `
								width: 100%;
								height: 100%;
								background-color: #ffffff;
								cursor: ns-resize;
								box-shadow: var(--thing-thickness-1-fast);
							`,
						},
						div({
							"oceloti-ref": "slider",
							style: `
								position: absolute;
								left: 0;
								top: 0;
								width: 100%;
								height: 100%;
							`,
						}),
						div({
							"oceloti-ref": "bar",
							style: () => `
								position: absolute;
								display: flex;
								justify-content: center;
								align-items: flex-end;
								bottom: 0;
								left: 0;
								padding-bottom: 8px;
								width: 100%;
								height: ${value}%;
								background-color: #FF0000;
								mix-blend-mode: multiply;
								pointer-events: none;
							`,
						}),
						div(
							{
								style: `
									position: absolute;
						      		left: 50%;
						      		bottom: 0;
									transform: translate(-50%, 100%);
	                        		min-width: 16px;
								`,
							},
							div(
								{
									"oceloti-ref": "label",
									style: `
       									border: 1px solid #000000;
       									padding: 2px;
							      		background: white;
		                        		white-space: nowrap;
										user-select: none;
										-webkit-user-select: none;
		                        	`,
								},
								`${label}: ${value}%`,
							),
							input({
								value: label,
								type: "text",
							}),
						),
					),
				);

				return thing_el;
			},
		});
	},
});
