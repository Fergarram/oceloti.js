register_oceloti_module({
	name: "dnd-manager",
	deps: [],
	init({ use_module, room }) {

		const dnd_handlers = [];
		function register_dnd_handler({ for_type, on_drop }) {
			dnd_handlers.push({ for_type, on_drop });
		}

		room.addEventListener("dragover", (e) => {
			e.preventDefault();
			// @TODO: Show custom UI for dropping something... We don't know what that something is.
		});

		room.addEventListener("drop", (drop_event) => {
			drop_event.preventDefault();
			const files = drop_event.dataTransfer.files;
			const is_link = drop_event.dataTransfer.types.find(t => t.includes("url")) !== undefined;
			const text_data = drop_event.dataTransfer.getData("text/plain");
			const is_oceloti_item = drop_event.dataTransfer.types.includes("oceloti/item");

			// @NOTES:
			// ------
			// There are two main branching types: file / text
			// The text branch could be anything from link to plain text to internal dnd type.
			// If file, types get more predictable.

			if (files.length === 0) {
				console.log("is link?", is_link); // @TODO: use link to see if it's an image.
				console.log("text data", text_data);

				// @STEP 1: Handle known text_data type for cards.

			} else if (files.length > 0) {
				for (let file of files) {
					
					// @STEP 2: Determine file dnd type

					// @STEP 3: Once we know the type, filter handlers to match with for_type.
					//          It's possible there are multiple handlers for a single type.
					//          In that case the user should be asked to select one (optionally select default).

					if (file.type.startsWith("image/")) {
						const reader = new FileReader();
						reader.onload = (e) => {
							const img = new Image();
							img.onload = () => {
								const image_card = document.createElement("figure");
								image_card.setAttribute("oceloti-card", "");
								image_card.classList.add("paper");
								image_card.style.left = `${window.scrollX + drop_event.clientX - (img.naturalWidth / 2)}px`;
								image_card.style.top = `${window.scrollY + drop_event.clientY - (img.naturalHeight / 2)}px`;
								image_card.style.width = `${img.naturalWidth}px`;
								image_card.style.height = `${img.naturalHeight}px`;
								image_card.appendChild(img);
								room.appendChild(image_card);
							};
							img.src = e.target.result;
							img.setAttribute("draggable", "false");
						};
						reader.readAsDataURL(file);
					}
				}
			}
		});
	}
});