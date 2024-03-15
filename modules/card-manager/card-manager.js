register_oceloti_module({
	name: "card-manager",
	deps: [],
	init({ use_module, room, hud }) {
		const card_query = document.querySelectorAll("[oceloti-card]");
		const all_cards = Array.from(card_query);

		const exports = {
			thing_initializers: {},
			add_thing_to_room(thing, initializer) {
				const id = crypto.randomUUID();
				exports.thing_initializers[id] = initializer;
				thing.id = id;
				room.appendChild(thing);
			}
		};

		let last_mouse_x = 0;
		let last_mouse_y = 0;
		let delta_x = 0;
		let delta_y = 0;
		let dragged_card = null;
		let dragging_x = 0;
		let dragging_y = 0;

		const observer = new MutationObserver((mutations) => {
			for (let mutation of mutations) {
				if (mutation.type === "childList") {
					if (mutation.addedNodes.length > 0) {
						mutation.addedNodes.forEach((node) => {
							if (
								node.id !== "oceloti-floating-card" &&
								node.getAttribute("oceloti-card-state") !== "elevated" &&
								node.hasAttribute("oceloti-card")
							) {
								card_drop(node);
							}
						});
					}

					if (mutation.removedNodes.length > 0) {
						mutation.removedNodes.forEach((node) => {
							if (
								node.id !== "oceloti-floating-card" &&
								node.getAttribute("oceloti-card-state") !== "elevated" &&
								node.hasAttribute("oceloti-card")
							) {
								card_lift(node);
							}
						});
					}
				}
			}
		});

		observer.observe(room, { childList: true });

		// @LAST: Uncomment to see chaos after saving room.
		// window.addEventListener("load", () => {
		// 	all_cards.forEach(card_drop);
		// });

		function initialize_card_state(card) {
		    setTimeout(() => {
		    	card.setAttribute("oceloti-card-state", "idle");
			    card.style.removeProperty("will-change");
			    card.style.removeProperty("pointer-events");
		    }, 0);

			card.addEventListener("mousedown", handle_mousedown);

			function handle_mousedown(e) {
			    if (!e.target) return;
			    if (dragged_card !== null) return;
			    const target = e.target;
			    if (
			        card.getAttribute("oceloti-card-state") !== "idle" ||
			        target.tagName === "A" ||
			        target.tagName === "BUTTON" ||
			        target.tagName === "INPUT" ||
			        target.tagName === "TEXTAREA" ||
			        (
			        	target.tagName === "IMG" && 
			        	target.getAttribute("draggable") !== "false"
			        ) 
			    ) {
			        return;
			    }

			    if (e.button !== 0) return;

			    document.body.classList.toggle("is-dragging");
			    let x = Number(card.style.left.replace("px", ""));
		    	let y = Number(card.style.top.replace("px", ""));
		    	dragging_x = x;
		    	dragging_y = y;

			    last_mouse_x = e.clientX;
			    last_mouse_y = e.clientY;

			    card.style.willChange = "filter, transform";
			    card.style.pointerEvents = "none";
			    const card_html = card.outerHTML;
			    card.remove();

			    const floating_wrapper = document.createElement("div");

			    floating_wrapper.id = "oceloti-floating-card";
			    floating_wrapper.style.pointerEvents = "none";
			    floating_wrapper.style.position = "absolute";
			    floating_wrapper.style.left = "0";
			    floating_wrapper.style.top = "0";
			    floating_wrapper.style.willChange = "transform";
			    floating_wrapper.style.transform = `translate(${x}px, ${y}px)`;
			    floating_wrapper.innerHTML = card_html;

			    const inner_card = floating_wrapper.firstElementChild;
			    inner_card.style.left = "";
			    inner_card.style.top = "";

			    room.appendChild(floating_wrapper);
			    dragged_card = inner_card;

			    window.addEventListener("mousemove", handle_mousemove);
			    window.addEventListener("mouseup", handle_mouseup);
			}
		}

		function handle_mousemove(e) {
		    if (e.button !== 0) return;

		    delta_x = last_mouse_x - e.clientX;
		    delta_y = last_mouse_y - e.clientY;
		    last_mouse_x = e.clientX;
		    last_mouse_y = e.clientY;

		    if (dragged_card) {
		    	dragged_card.setAttribute("oceloti-card-state", "elevated");
		    	dragging_x = dragging_x - delta_x;
		    	dragging_y = dragging_y - delta_y;
		    	dragged_card.parentElement.style.transform = `translate(${dragging_x}px, ${dragging_y}px)`;
		    }
		}

		function handle_mouseup(e) {
		    if (e.button !== 0) return;
			document.body.classList.toggle("is-dragging");
		    const wrapper = dragged_card.parentNode;
		    wrapper.after(dragged_card);

		    dragged_card.style.left = `${dragging_x}px`;
		    dragged_card.style.top = `${dragging_y}px`;
		    card_drop(dragged_card);

		    wrapper.remove();
		    dragged_card = null;

		    window.removeEventListener("mousemove", handle_mousemove);
		    window.removeEventListener("mouseup", handle_mouseup);
		}

		function card_drop(card) {
			initialize_card_state(card);
			exports.thing_initializers[card.id](card);
		}

		function card_lift(card) {
			// @TODO: Remove this outdated event.
			const event = new CustomEvent("cardlift", { detail: { card } });
			window.dispatchEvent(event);
		}

		return exports;
	}
});