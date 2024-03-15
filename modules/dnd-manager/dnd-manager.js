register_oceloti_module({
	name: "dnd-manager",
	deps: [],
	init({ use_module, room, hud }) {
		const exports = {
			known_dnd_types: [],
			drop_handlers: [],
			register_dnd_type(invoking_module, type_name) {
				if (exports.known_dnd_types.includes(type_name)) {
					// @FIXME: I still need to decide how to handle multiple handlers for the same types.
					//         I think it should be the room user who decides through a UI.
					const existing_handler = exports.drop_handlers.find(h => h.dnd_types.includes(type_name));
					console.warn(`The "${invoking_module}" module is trying to register a previously added dnd type "${type_name}" but "${existing_handler.invoking_module}" has already registered it.`);
					return;
				}
				exports.known_dnd_types.push(type_name);
			},
			register_drop_handler({
				invoking_module, dnd_types, callback
			}) {
				dnd_types.forEach(t => exports.register_dnd_type(invoking_module, t));
				exports.drop_handlers.push({
					invoking_module,
					dnd_types,
					callback,
				});
			}
		};

		room.addEventListener("dragover", (e) => {
			e.preventDefault();

			if (!e.dataTransfer.types.some(str => exports.known_dnd_types.includes(str))) {
				e.dataTransfer.effectAllowed = "none";
				return;
			}
		});

		room.addEventListener("dragleave", (e) => {
			e.preventDefault();
		});

		room.addEventListener("drop", (event) => {
			event.preventDefault();

			const matching_handlers = exports.drop_handlers.filter(({ dnd_types, handler }) => {
				return event.dataTransfer.types.some(t => exports.known_dnd_types.includes(t));
			});

			if (matching_handlers.length === 0) return;

			matching_handlers[0].callback(event);
		});

		return exports;
	}
});