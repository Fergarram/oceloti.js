register_oceloti_module({
	name: "hand-cursor",
	deps: [ "thing-manager" ],
	init({ room, next_loop, use_module }) {
		let last_mouse_x = 0;
		let last_mouse_y = 0;
		let delta_x = 0;
		let delta_y = 0;
		let dragged_thing = null;
		let dragging_x = 0;
		let dragging_y = 0;

		const { on_place, place_thing } = use_module("thing-manager");

		on_place(init);

		async function init(thing, first_mount = false) {
			if (!first_mount) {
			    await next_loop();
		    	thing.setAttribute("oceloti-thing-state", "idle");
			    thing.style.removeProperty("will-change");
			    thing.style.removeProperty("pointer-events");
			}

			thing.addEventListener("mousedown", handle_mousedown);

			function handle_mousedown(e) {
				//@STEP: Check if the cursor is active.
				return;

			    if (!e.target) return;
			    if (dragged_thing !== null) return;
			    const target = e.target;
			    if (
			        thing.getAttribute("oceloti-thing-state") !== "idle" ||
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
			    let x = Number(thing.style.left.replace("px", ""));
		    	let y = Number(thing.style.top.replace("px", ""));
		    	dragging_x = x;
		    	dragging_y = y;

			    last_mouse_x = e.clientX;
			    last_mouse_y = e.clientY;

			    thing.style.willChange = "filter, transform";
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

		    if (dragged_thing) {
		    	dragged_thing.setAttribute("oceloti-thing-state", "elevated");
		    	dragging_x = dragging_x - delta_x;
		    	dragging_y = dragging_y - delta_y;
		    	// @STEP: Get computed transform scale
		    	dragged_thing.parentElement.style.transform = `translate(${dragging_x}px, ${dragging_y}px)`;
		    }
		}

		function handle_mouseup(e) {
		    if (e.button !== 0) return;
			document.body.classList.toggle("is-dragging");
		    const wrapper = dragged_thing.parentNode;
		    wrapper.after(dragged_thing);

		    dragged_thing.style.left = `${dragging_x}px`;
		    dragged_thing.style.top = `${dragging_y}px`;
		    place_thing(dragged_thing);

		    wrapper.remove();
		    dragged_thing = null;

		    window.removeEventListener("mousemove", handle_mousemove);
		    window.removeEventListener("mouseup", handle_mouseup);
		}
	}
});