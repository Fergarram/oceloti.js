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
			add_menu("handbook", [
				button({
					onclick() {
						const data = {
							handler: "notebook-paper",
							width: 300,
							height: 400,
							state: "read",
							content: "",
						};
						const available_handlers = get_item_handler(data.handler);
						const x = window.scrollX + e.clientX;
						const y = window.scrollY + e.clientY;
						van.add(room, available_handlers[0].renderer({ ...data, x, y }));
					}
				}, "🗒️ new paper"),
			]);
		});
	}
});