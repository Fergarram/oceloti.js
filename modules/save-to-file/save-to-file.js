let wrapper_el = null;

window.addEventListener("keydown", handle_keydown);

function handle_close() {
	wrapper_el.remove();
}

function handle_keydown(e) {
	if ((e.metaKey || e.ctrlKey) && e.key === "s") {
		e.preventDefault();
		wrapper_el = document.createElement("div");
		wrapper_el.innerHTML = `
			<dialog oceloti-dialog="save-to-file">
				<div>
					<p>
						Right-click download link to save as.
					</p>
					<a>Download</a>
				</div>
			</dialog>
		`;
		document.body.appendChild(wrapper_el);
		
		setTimeout(() => {
			wrapper_el.firstElementChild.addEventListener("close", handle_close);

			const dom_content = document.documentElement.outerHTML;
			const blob = new Blob([dom_content], { type: 'text/html' });
			const url = URL.createObjectURL(blob);
			const dialog_el = document.querySelector(`[oceloti-dialog="save-to-file"]`);
			const link_el = dialog_el.querySelector("a");
			link_el.href = url;
			link_el.download = `${document.title}.html`;
			
			dialog_el.showModal();
		}, 0);
	}
}