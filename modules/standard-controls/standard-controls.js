register_oceloti_module({
	name: "standard-controls",
	deps: [],
	init({ use_module, room, are_dialogs_open }) {
		let room_width = room.offsetWidth;
		let room_height = room.offsetHeight;

		// @TODO: Save zoom to local storage.
		window.zoom = 100;

		if (window.location.hash) {
			const id = window.location.hash.replace("#", "");
			const el = document.getElementById(id);
			if (el) el.scrollIntoView();
			else window.scrollTo(0,0);
		} else {
			window.scrollTo(0,0);
		}

		let camera_x = 0;
		let camera_y = 0;

		let last_middle_click_x = 0;
		let last_middle_click_y = 0;

		let is_panning = false;
		let scroll_ticking = false;
		let is_scrolling = false;
		let scrolling_timeout = null;

		window.requestAnimationFrame(step);
		room.addEventListener("mousedown", handle_mousedown);
		window.addEventListener("mouseup", handle_mouseup);
		window.addEventListener("mousemove", handle_mousemove);
		window.addEventListener("scroll", handle_scroll);
		window.addEventListener("wheel", handle_wheel, { passive: false });

		function step(dt) {
			if (camera_x <= 0) camera_x = 0;
			if (camera_y <= 0) camera_y = 0;
			if (camera_x >= room_width - window.innerWidth) camera_x = room_width - window.innerWidth;
			if (camera_y >= room_height - window.innerHeight) camera_y = room_height - window.innerHeight;
			if (is_panning) {
				window.scroll({
					top: camera_y,
					left: camera_x,
					behavior: "instant"
				});
			}
			window.requestAnimationFrame(step);
		}

		function handle_mousedown(e) {
			if (are_dialogs_open()) {
				e.preventDefault();
				return;
			}
			if (e.button === 1) {
				e.preventDefault();
				is_panning = true;
				document.body.classList.toggle("is-panning");
				last_middle_click_x = e.clientX;
				last_middle_click_y = e.clientY;
			}
		}

		function handle_mouseup(e) {
			if (e.button === 1) {
				is_panning = false;
				document.body.classList.toggle("is-panning");
			}
		}

		function handle_mousemove(e) {
			if (is_panning) {
				const dx = e.clientX - last_middle_click_x;
				const dy = e.clientY - last_middle_click_y;
				camera_x -= dx;
				camera_y -= dy;
				last_middle_click_x = e.clientX;
				last_middle_click_y = e.clientY;
			}
		}

		function handle_scroll(e) {
			if (!scroll_ticking) {
				window.requestAnimationFrame(() => {
					if (!is_scrolling) {
						document.body.classList.toggle("is-scrolling");
					}
					is_scrolling = true;
					clearTimeout(scrolling_timeout);
		            scrolling_timeout = setTimeout(() => {
						document.body.classList.toggle("is-scrolling");
		                is_scrolling = false;
		            }, 150);
					camera_x = window.scrollX;
					camera_y = window.scrollY;
					scroll_ticking = false;
				});
				scroll_ticking = true;
			}
		}

		function handle_wheel(e) {
			if (are_dialogs_open()) {
				e.preventDefault();
				return;
			}

			if (!e.ctrlKey) return;


			// @NOTE: alternative transform-based zoom sketch

			// e.preventDefault();

			// window.zoom = zoom - e.deltaY;
			// console.log(window.zoom);
			// room.style.willChange = "transform";
			// room.style.transformOrigin = "top left";
			// room.style.transform = `scale(${window.zoom / 100}) translateZ(0)`

			// return;

			const dir = e.deltaY > 0 ? -10 : 10;
			let zoom = window.devicePixelRatio * 100;
			zoom = Math.round(zoom + dir);
			zoom = Math.round(zoom / 10) * 10;
			window.zoom = zoom;
			if (zoom === 100) {
				document.body.classList.remove("has-zoom");
			} else {
				document.body.classList.add("has-zoom");
			}
			window.dispatchEvent(new Event("zoom"));
		}
	}
});