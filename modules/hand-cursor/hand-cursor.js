register_oceloti_module({
	name: "hand-cursor",
	deps: [ "thing-manager", "cursor-manager" ],
	init({ room, room_name, next_loop, use_module }) {
		let last_mouse_x = 0;
		let last_mouse_y = 0;
		let delta_x = 0;
		let delta_y = 0;
		let dragged_thing = null;
		let dragging_x = 0;
		let dragging_y = 0;

		const { register_cursor, set_active_cursor, is_cursor_active } = use_module("cursor-manager");
		const { on_place, place_thing } = use_module("thing-manager");

		register_cursor({
			name: "Hand Cursor",
			slug: "hand",
			icon: "移",
			description: "Magic hand that allows you to move things and yourself around."
		});

		function handle_auxclick(event) {
			if (event.target.tagName === 'A' && event.button === 1 && !is_cursor_active("pointer")) {
				event.preventDefault();
			}
		}

		document.addEventListener('auxclick', handle_auxclick);
		room.addEventListener("contextmenu", handle_contextmenu);

		function handle_contextmenu(e) {
			if (!is_cursor_active("hand")) return;
			e.preventDefault();
		}

		on_place(async (thing, first_mount = false) => {
			if (!first_mount) {
			    await next_loop();
		    	thing.setAttribute("oceloti-thing-state", "idle");
			    thing.style.removeProperty("will-change");
			    thing.style.removeProperty("pointer-events");
			}

			thing.addEventListener("mousedown", handle_mousedown);
			thing.addEventListener("contextmenu", handle_contextmenu);

			function handle_mousedown(e) {
				if (!is_cursor_active("hand")) return;
			    if (!e.target) return;
			    if (dragged_thing !== null) return;
			    const target = e.target;
			    const is_contenteditable = target.isContentEditable || target.closest('[contenteditable="true"]');
			    if (
			        thing.getAttribute("oceloti-thing-state") !== "idle" ||
			        target.tagName === "A" ||
			        target.tagName === "BUTTON" ||
			        target.tagName === "INPUT" ||
			        target.tagName === "TEXTAREA" ||
			        is_contenteditable ||
			        (
			        	target.tagName === "IMG" && 
			        	target.getAttribute("draggable") !== "false"
			        ) 
			    ) {
			    	// @NOTE: This seems to work. It used to just return.
			    	// I need to test in other browsers.
			        e.preventDefault();
			    }

			    if (e.button !== 0) return;

			    document.body.classList.toggle("is-dragging");
			    let x = Number(thing.style.left.replace("px", ""));
		    	let y = Number(thing.style.top.replace("px", ""));
		    	dragging_x = x;
		    	dragging_y = y;

			    last_mouse_x = e.clientX;
			    last_mouse_y = e.clientY;

			    thing.style.willChange = "filter, transform, left, top";

			    if (!e.shiftKey) {
			    	thing.style.pointerEvents = "none";
				    const thing_html = thing.outerHTML;
				    thing.remove();

				    const floating_wrapper = document.createElement("div");

				    floating_wrapper.id = "oceloti-floating-thing";
				    floating_wrapper.style.pointerEvents = "none";
				    floating_wrapper.style.position = "absolute";
				    floating_wrapper.style.left = "0";
				    floating_wrapper.style.top = "0";
				    floating_wrapper.style.willChange = "transform";
				    floating_wrapper.style.transform = `translate(${x}px, ${y}px) translateZ(0)`;
				    floating_wrapper.innerHTML = thing_html;

				    const inner_thing = floating_wrapper.firstElementChild;
				    inner_thing.style.left = "";
				    inner_thing.style.top = "";

				    room.appendChild(floating_wrapper);
				    dragged_thing = inner_thing;
			    } else {
			    	dragged_thing = thing;
			    }

			    window.addEventListener("mousemove", handle_mousemove);
			    window.addEventListener("mouseup", handle_mouseup);
			}
		});

		async function handle_mousemove(e) {
		    if (e.button !== 0) return;

		    delta_x = last_mouse_x - e.clientX;
		    delta_y = last_mouse_y - e.clientY;
		    last_mouse_x = e.clientX;
		    last_mouse_y = e.clientY;

		    dragging_x = dragging_x - delta_x;
	    	dragging_y = dragging_y - delta_y;
	    	// @STEP: Get computed transform scale

		    if (dragged_thing && !e.shiftKey) {
		    	dragged_thing.setAttribute("oceloti-thing-state", "elevated");
		    	dragged_thing.parentElement.style.transform = `translate(${dragging_x}px, ${dragging_y}px)`;
		    } else if (dragged_thing && e.shiftKey) {
		    	dragged_thing.style.left = `${dragging_x}px`;
		    	dragged_thing.style.top = `${dragging_y}px`;
		    	await next_loop();
				// localStorage.setItem(`OCELOTI_ROOM_SNAPSHOT_${room_name}`, room.innerHTML);
		    }
		}

		function handle_mouseup(e) {
		    if (e.button !== 0) return;
			document.body.classList.toggle("is-dragging");

			if (!e.shiftKey) {
			    const wrapper = dragged_thing.parentNode;
			    wrapper.after(dragged_thing);

			    dragged_thing.style.left = `${dragging_x}px`;
			    dragged_thing.style.top = `${dragging_y}px`;
			    place_thing(dragged_thing);

			    wrapper.remove();
			} else {
			    dragged_thing.style.removeProperty("will-change");
			}

		    dragged_thing = null;

		    window.removeEventListener("mousemove", handle_mousemove);
		    window.removeEventListener("mouseup", handle_mouseup);
		}
	}
});