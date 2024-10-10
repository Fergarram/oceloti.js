register_oceloti_module({
	name: "thing-handbook",
	deps: ["inventory", "van", "context-menu"],
	init({ use_module, room }) {
		const van = use_module("van");
		const { get_item_handler } = use_module("inventory");
		const { add_menu } = use_module("context-menu");
		const { button } = van.tags;

		room.addEventListener("mousedown", (e) => {
			if (e.button !== 2) return;
			if (e.target !== room) return;

			const notebook_item = {
				handler: "notebook-paper",
				width: 300,
				state: "write",
				content: "",
			};
			const available_notebook_handlers = get_item_handler(notebook_item.handler);

			const assistant_chat_item = {
				handler: "assistant-chat",
				width: 400,
				height: 400,
				state: "default",
				content: "",
			};
			const available_assistant_chat_handlers = get_item_handler(assistant_chat_item.handler);

			const graph_item = {
				handler: "graph",
				width: 72,
				height: 250,
				state: "default",
				content: "value:25",
			};
			const available_graph_handlers = get_item_handler(graph_item.handler);

			const portal_item = {
				handler: "portal",
				width: 250,
				height: 250,
				state: "default",
				content: "",
			};
			const available_portal_handlers = get_item_handler(portal_item.handler);

			const monaco_editor_item = {
				handler: "monaco-editor",
				width: 600,
				height: 800,
				state: "default",
				content: "",
			};
			const available_monaco_editor_handlers = get_item_handler(monaco_editor_item.handler);

			// @STEP: This is unfinished, it's hardcoded.
			add_menu("handbook", [
				available_notebook_handlers.length > 0
					? button(
							{
								onclick() {
									const x = window.scrollX + e.clientX;
									const y = window.scrollY + e.clientY;
									van.add(room, available_notebook_handlers[0].renderer({ ...notebook_item, x, y }));
								},
							},
							`${available_notebook_handlers[0].icon()} new paper`,
						)
					: button({ style: "font-style: italic; opacity: 0.5;", disabled: true }, "Missing module"),
				available_assistant_chat_handlers.length > 0
					? button(
							{
								onclick() {
									const x = window.scrollX + e.clientX;
									const y = window.scrollY + e.clientY;
									van.add(
										room,
										available_assistant_chat_handlers[0].renderer({ ...assistant_chat_item, x, y }),
									);
								},
							},
							`${available_assistant_chat_handlers[0].icon()} new chat`,
						)
					: button({ style: "font-style: italic; opacity: 0.5;", disabled: true }, "Missing module"),
				available_portal_handlers.length > 0
					? button(
							{
								onclick() {
									const x = window.scrollX + e.clientX;
									const y = window.scrollY + e.clientY;
									van.add(room, available_portal_handlers[0].renderer({ ...portal_item, x, y }));
								},
							},
							`${available_portal_handlers[0].icon()} new portal`,
						)
					: button({ style: "font-style: italic; opacity: 0.5;", disabled: true }, "Missing module"),
				available_graph_handlers.length > 0
					? button(
							{
								onclick() {
									const x = window.scrollX + e.clientX;
									const y = window.scrollY + e.clientY;
									van.add(room, available_graph_handlers[0].renderer({ ...graph_item, x, y }));
								},
							},
							`${available_graph_handlers[0].icon()} new graph`,
						)
					: button({ style: "font-style: italic; opacity: 0.5;", disabled: true }, "Missing module"),
				available_monaco_editor_handlers.length > 0
					? button(
							{
								onclick() {
									const x = window.scrollX + e.clientX;
									const y = window.scrollY + e.clientY;
									van.add(
										room,
										available_monaco_editor_handlers[0].renderer({ ...monaco_editor_item, x, y }),
									);
								},
							},
							`${available_monaco_editor_handlers[0].icon()} new paper`,
						)
					: button({ style: "font-style: italic; opacity: 0.5;", disabled: true }, "Missing module"),
			]);
		});
	},
});
