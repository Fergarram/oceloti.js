register_oceloti_module({
	name: "thing-manager",
	deps: [],
	init({ room, next_loop }) {
		const exports = {
			thing_initializers: {},
			place_callbacks: [],
			register_thing_initializer(thing_name, initializer) {
				exports.thing_initializers[thing_name] = initializer;
			},
			on_place(callback) {
				exports.place_callbacks.push(callback);
			},
			async place_thing(thing, first_mount = false) {
				console.log("placed")
				exports.place_callbacks.forEach(c => c(thing, first_mount));

				const thing_name = thing.getAttribute("oceloti-thing");
				if (
					exports.thing_initializers &&
					exports.thing_initializers[thing_name]
				) {
					exports.thing_initializers[thing_name](thing);
				}


				if (!first_mount) {
					await next_loop();
					// localStorage.setItem(`OCELOTI_ROOM_SNAPSHOT_${room_name}`, room.innerHTML);
				}
			},
			async lift_thing(thing) {
				console.log("lifted")
				await next_loop();
				// localStorage.setItem(`OCELOTI_ROOM_SNAPSHOT_${room_name}`, room.innerHTML);
			}
		};

		const observer = new MutationObserver((mutations) => {
			for (let mutation of mutations) {
				if (mutation.type === "childList") {
					if (mutation.addedNodes.length > 0) {
						mutation.addedNodes.forEach((node) => {
							if (
								node.nodeType === 1 &&
								node.getAttribute("oceloti-motion") !== "elevated" &&
								node.hasAttribute("oceloti-thing")
							) {
								exports.place_thing(node);
							}
						});
					}

					if (mutation.removedNodes.length > 0) {
						mutation.removedNodes.forEach((node) => {
							if (
								node.nodeType === 1 &&
								node.getAttribute("oceloti-motion") !== "elevated" &&
								node.hasAttribute("oceloti-thing")
							) {
								exports.lift_thing(node);
							}
						});
					}
				}
			}
		});

		observer.observe(room, { childList: true });

		window.addEventListener("load", async () => {
			await next_loop();
			const thing_query = document.querySelectorAll("[oceloti-thing]");
			const all_things = Array.from(thing_query);
			all_things.forEach((thing) => exports.place_thing(thing, true));
		});

		return exports;
	}
});
