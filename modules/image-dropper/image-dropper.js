(async () => {
	const room = document.querySelector("[oceloti-room]");
	if (!room) return;

	room.addEventListener("dragover", (e) => {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	});

	room.addEventListener("drop", (drop_event) => {
		drop_event.stopPropagation();
		drop_event.preventDefault();
		const files = drop_event.dataTransfer.files;

		if (files.length) {
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
