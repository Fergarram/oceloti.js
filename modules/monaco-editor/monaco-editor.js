register_oceloti_module({
	name: "monaco-editor",
	deps: ["inventory", "van", "context-menu"],
	init({ use_module }) {
		const van = use_module("van");
		const { add_menu } = use_module("context-menu");
		const { register_item_handler } = use_module("inventory");
		const { div } = van.tags;

		const THING_NAME = "monaco-editor";

		register_item_handler({
			icon: () => "頁",
			name: THING_NAME,
			description: ({ content, state }) => {
				return "A piece of code";
			},
			initializer,
			encoder,
			renderer,
		});

		function renderer({ x, y, width, content }) {
			const el = div(
				{
					"oceloti-thing": THING_NAME,
					"oceloti-state": "uninitialized",
					"oceloti-motion": "idle",
					style: `
					left: ${x - width / 2}px;
					top: ${y - 140}px;
					width: ${width}px;
					height: ${width}px;
				`,
				},
				div({
					style: `
						width: 100%;
						height: 100%;
					`,
				}),
			);

			initializer(el, content);

			return el;
		}

		function encoder(thing) {
			return {
				handler: THING_NAME,
				state: "default",
				width: thing.offsetWidth,
				height: thing.offsetHeight,
				content: "",
			};
		}

		function initializer(thing, content = "") {
			if (thing.getAttribute("oceloti-state") === "initialized") {
				return;
			}

			thing.firstElementChild.innerHTML = "";
			require.config({ paths: { vs: "https://unpkg.com/monaco-editor@0.21.2/min/vs" } });
			require(["vs/editor/editor.main"], function () {
				const editor = monaco.editor.create(thing.firstElementChild, {
					minimap: { enabled: false },
					automaticLayout: true,
					value: content,
					language: "javascript",
				});
			});

			thing.setAttribute("oceloti-state", "initialized");
		}
	},
});
