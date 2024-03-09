(async () => {
	const room = document.querySelector("[oceloti-room]");
	if (!room) return;

	room.addEventListener("dragover", (e) => {
		e.preventDefault();
	});

	room.addEventListener("drop", (drop_event) => {
		drop_event.preventDefault();
		const files = drop_event.dataTransfer.files;
		const is_web_image = drop_event.dataTransfer.types.find(t => t.includes("image")) !== undefined;
		const is_link = drop_event.dataTransfer.types.find(t => t.includes("url")) !== undefined;
		const text_data = drop_event.dataTransfer.getData("text/plain");

		if (files.length === 0) {
			// @TODO: It seems that is_image is not reliable. But links are...
			//        So the solution will be to try to see if the link is an image by fetching it.
			console.log("is image?", is_web_image);
			console.log("is link?", is_link);
			console.log("text data", text_data);

		} else if (files.length > 0) {
			const file = files[0];
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
	});
})();
