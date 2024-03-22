register_oceloti_module({
	name: "local-bag",
	deps: ["van", "context-menu", "inventory"],
	init({ use_module, hud, room }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { drop_item_from_bag, add_item_to_bag, move_item_in_bag } = use_module("inventory");

		const slots = van.state([
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
			null,null,null,
		]);

		const { div, button, img, ul, li, span } = van.tags;

		const show_inventory = van.state(false);

		function Slot(slot, index) {
			const attrs = {
				index,
				class: "inventory-slot",
			};
			if (slot) {
				attrs["oceloti-menu"] = "inventory-item";
				attrs["title"] = slot.description;
				attrs["onmousedown"] = (e) => {
					if (e.button !== 2) return;
					add_menu("inventory_item", [
						button({
							onclick: () => {
								console.log(slot)
								drop_item_from_bag(
									slots,
									index, 
									window.scrollX + window.innerWidth / 2,
									window.scrollY + window.innerHeight / 2
								);
							}
						},
							"⤵️ Drop"
						),
						button({
							onclick: () => {}
						},
							"🔍 inspect"
						),
						button({
							onclick: () => {}
						},
							"🖨️ copy"
						),
						button({
							onclick: () => {}
						},
							"🗑️ Trash"
						)
					]);
				}
			} else {
				attrs["ondragover"] = (e) => {
					e.preventDefault();
					if (!e.dataTransfer.types.includes("oceloti/item")) {
						e.dataTransfer.effectAllowed = "none";
						return;
					}
					e.target.classList.add("dragover");
				};
				attrs["ondragleave"] = (e) => {
					e.preventDefault();
					if (!e.dataTransfer.types.includes("oceloti/item")) {
						e.dataTransfer.effectAllowed = "none";
						return;
					}
					e.target.classList.remove("dragover");
				};
				attrs["ondrop"] = (e) => {
					e.preventDefault();
					if (e.dataTransfer.types.includes("oceloti/item")) {
						const slot = JSON.parse(e.dataTransfer.getData("oceloti/item"));
						const to = Number(e.currentTarget.getAttribute("index"));
						move_item_in_bag(slots, slot.index, to);
					}
				};
			}
			return li(
				attrs,
				span({
					"draggable": slot ? "true" : "false",
					style: !slot ? "display: none;" : "",
					class: "inventory-item emoji",
					ondragstart: (e) => {
						e.dataTransfer.setData('oceloti/item', JSON.stringify({
							index,
							...slot,
						}));
						e.dataTransfer.effectAllowed = 'move';
					},
				},
					slot ? slot.icon : ""
				)
			);
		}

		function InventoryGrid(list) {
			return ul({
				class: "inventory-grid",
				style: () => `
					display: ${show_inventory.val ? "grid" : "none"}
				`
			},
				...list.map( (slot, i) => Slot(slot, i))
			);
		}

		van.add(hud, div({
			style: "position: relative;",
		},
			button({
				onclick: (e) => {
					e.target.classList.toggle("selected");
					show_inventory.val = !show_inventory.val;
				}
			},
				"🎒 local bag (b)"
			),
			() => InventoryGrid(slots.val)
		));

		van.add(hud, div({
			style: "position: relative;",
		},
			button({
				style: `
					background: royalblue;
					color: white;
				`,
			},
				"☁️ drive bag"
			),
		));

		// @DEBUG
		window.addEventListener("load", () => {
			const items = [
				{
					handler: "notebook-paper",
					width: 300,
					height: 400,
					state: "read",
					content: ""
				},
				{
					handler: "pdf-reader",
					width: 300,
					height: 400,
					state: "read",
					content: "https://arena-attachments.s3.amazonaws.com/18283024/b0ae4bfcbafdb3f9ad61216303baf1f0.pdf?1664478680"
				},
				{
					handler: "notebook-paper",
					width: 300,
					height: 400,
					state: "read",
					content: "Hello world"
				},
			];

			items.forEach((item, index) => {
				add_item_to_bag(slots, item, index);
			});
		});
	}
});