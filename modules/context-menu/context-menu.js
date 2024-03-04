(() => {
	const hud = document.getElementById("hud");
	window.oceloti_menu_items = [];
	document.addEventListener("contextmenu", function(e) {
		if (
	        are_dialogs_open() ||
	        e.target.hasAttribute("use-native-menu") ||
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

	    let menu = document.getElementById("oceloti-menu");

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
				window.oceloti_menu_items = [];
			}
		}

		if (
	    	e.target.id === "oceloti-menu" ||
	    	e.target.parentNode.id === "oceloti-menu"
	    ) {
	    	close_menu();
	    	return;
	    }

	    if (menu) close_menu();

    	const { div, button } = van.tags;
	    menu = div({
	    	id: "oceloti-menu",
	    	style: () => `
	    		position: fixed;
	    		left: ${e.clientX}px;
	    		top: ${e.clientY}px;
	    	`
	    },
	    	window.oceloti_menu_items.length > 0
	    		? window.oceloti_menu_items.map(i => i)
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

	    window.addEventListener("mousedown", (e) => {
	    	if (
		        e.button === 2 ||
		        e.target.parentNode === menu
		    ) {
		        return;
		    }
	    	if (menu) close_menu();
	    	window.oceloti_menu_items = [];
	    });
	});
})();