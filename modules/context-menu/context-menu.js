register_oceloti_module({
	name: "context-menu",
	deps: ["van"],
	init({ use_module, hud, are_dialogs_open }) {
		const { is_cursor_active } = use_module("cursor-manager");
		const van = use_module("van");

		const exports = {
			menu: {}
		};

		exports.add_menu = function(name, items) {
			exports.menu[name] = items;
		}

		document.addEventListener("contextmenu", function(e) {
		    let menu = document.getElementById("oceloti-context-menu");
		    
			if (!is_cursor_active("pointer") && e.target.closest('[oceloti-room]')) {
				if (menu) close_menu();
				exports.menu = {};
				return;
			}

			const selection = window.getSelection();
			if (
		        are_dialogs_open() ||
		        e.target.hasAttribute("use-native-menu") ||
		        selection.type === "Range" ||
		        e.target.tagName === "A" ||
		        e.target.tagName === "INPUT" ||
		        e.target.tagName === "TEXTAREA" ||
		        (
		        	e.target.tagName === "IMG" && 
		        	e.target.getAttribute("draggable") !== "false"
		        ) 
		    ) {
		        return;
		    }

		    e.preventDefault();

		    function close_menu(clean = false) {
				if (menu) menu.remove();
				let el = e.target;
				let has_menu = false;
				while (el) {
					has_menu = el.hasAttribute("oceloti-menu");
					if (has_menu) break;
					el = el.parentElement;
				}

				if (clean || !has_menu) {
					exports.menu = {};
				}
			}

			if (
		    	e.target.id === "oceloti-context-menu" ||
		    	e.target.parentNode.id === "oceloti-context-menu"
		    ) {
		    	close_menu();
		    	return;
		    }

		    if (menu) close_menu();

	    	const { div, button } = van.tags;
		    menu = div({
		    	id: "oceloti-context-menu",
		    	style: () => `
		    		left: ${e.clientX}px;
		    		top: ${e.clientY}px;
		    	`
		    },
		    	Object.keys(exports.menu).length > 0
		    		? Object.keys(exports.menu).map((group_name) => [
		    			div({ class: "separator" }),
		    			...exports.menu[group_name].map(item => item)
			    	])
			    	: button({ "disabled": "true" }, "Nothing to do")
		    );
		    van.add(hud, menu);

		    Array.from(menu.children).forEach((item) => {
		    	item.addEventListener("click", () => close_menu());
		    });

		    window.addEventListener("keydown", (e) => {
		    	if (e.key === "Escape") {
		    		if (menu) close_menu();
		    	}
		    });

		    const mousedown_handler = (e) => {
		    	if (
			        e.button === 2 ||
			        e.target.parentNode === menu
			    ) {
			        return;
			    }
		    	if (menu) close_menu();
		    	// @TODO: To fix the accumulating menu bug I need to check for the menu originator/trigger — if it's a different one then I just clear the menu.
		    	exports.menu = {};
		    };

		    window.addEventListener("mousedown", mousedown_handler);
		});

		return exports;
	}
});