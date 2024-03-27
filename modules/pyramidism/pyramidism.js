register_oceloti_module({
	name: "pyramidism",
	deps: ["van"],
	init: async ({ use_module, room, room_name, next_loop }) => {
		const van = use_module("van");

		const options = {
		  width: 1111,
		  height: 666,
		  layers: 8,
		  timestep: 2,
		  workgroup_size: 1,
		};
		
		let res = await fetch("../assets/pyramidism/compute.wgsl");
		const compute_program = await res.text();
		res = await fetch("../assets/pyramidism/frag.wgsl");
		const frag_program = await res.text();
		res = await fetch("../assets/pyramidism/vert.wgsl");
		const vert_program = await res.text();

		const bitmap_canvas = new OffscreenCanvas(1, 1);
		bitmap_canvas.width = options.width;
		bitmap_canvas.height = options.height;
		const bitmap_canvas_context = bitmap_canvas.getContext("2d", {
			willReadFrequently: true
		});
		bitmap_canvas_context.scale(1, -1);

		async function load_image_buffer(url) {
			let res = await fetch(url);
			const blob = await res.blob();
			const bitmap = await createImageBitmap(blob);
			bitmap_canvas_context.drawImage(bitmap, 0, -1 * options.height);

			const image_content = bitmap_canvas_context.getImageData(
				0, 0, options.width, options.height
			);
	    	
	    	return new Uint32Array(image_content.data.buffer);
		}

		const quarry_final_buffer = await load_image_buffer("../assets/pyramidism/quarry_left_empty.png");
		const workers_buffer = await load_image_buffer("../assets/pyramidism/workers.png");

		const thing = document.getElementById("pyramidism-wrapper");
		const canvas = thing.firstElementChild;
		const adapter = await navigator.gpu.requestAdapter();
		const device = await adapter.requestDevice();
		const context = canvas.getContext("webgpu");
		const device_pixel_ratio = window.devicePixelRatio;
		canvas.width = options.width * devicePixelRatio * 2;
		canvas.height = options.height * devicePixelRatio * 2;
		const presentation_format = navigator.gpu.getPreferredCanvasFormat();

		context.configure({
			device,
			format: presentation_format,
			alphaMode: "premultiplied",
		});

		const compute_shader = device.createShaderModule({ code: compute_program });
		const vertex_shader = device.createShaderModule({ code: vert_program });
		const fragment_shader = device.createShaderModule({ code: frag_program });

		let cell_buffers = {
			final: [null, null],
			layers: [null, null],
		};

		const bind_group_layout_compute = device.createBindGroupLayout({
			entries: [
				{
					// SIZE
					binding: 0,
					visibility: GPUShaderStage.COMPUTE,
					buffer: {
						type: "read-only-storage",
					},
				},
				{
					// GAME STATE BUFFER
					binding: 1,
					visibility: GPUShaderStage.COMPUTE,
					buffer: {
						type: "read-only-storage",
					},
				},
				{
					// Final buffer (current)
					binding: 2,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "read-only-storage" }
				},
				{
					// Final buffer (next)
					binding: 3,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "storage" }
				},
				{
					// Layers buffer (current)
					binding: 4,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "read-only-storage" }
				},
				{
					// Layers buffer (next)
					binding: 5,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "storage" }
				}
			]
		});

		const square_vertices = new Uint32Array([0, 0, 0, 1, 1, 0, 1, 1]);
		const square_buffer = device.createBuffer({
			size: square_vertices.byteLength,
			usage: GPUBufferUsage.VERTEX,
			mappedAtCreation: true,
		});

		new Uint32Array(square_buffer.getMappedRange()).set(square_vertices);
		square_buffer.unmap();

		const square_stride = {
			arrayStride: 2 * square_vertices.BYTES_PER_ELEMENT,
			stepMode: "vertex",
			attributes: [
				{
					shaderLocation: 1,
					offset: 0,
					format: "uint32x2"
				}
			]
		};

		const bind_group_layout_render = device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {
						type: "uniform",
					}
				}
			]
		});

		const cells_stride = {
			arrayStride: Uint32Array.BYTES_PER_ELEMENT,
			stepMode: "instance",
			attributes: [{
				shaderLocation: 0,
				offset: 0,
				format: "uint32",
			}]
		}

		let command_encoder;

		const compute_pipeline = device.createComputePipeline({
			layout: device.createPipelineLayout({
				bindGroupLayouts: [ bind_group_layout_compute ]
			}),
			compute: {
				module: compute_shader,
				constants: {
					block_size: options.workgroup_size,
					layers_count: options.layers
				}
			}
		});

		const size_buffer = device.createBuffer({
			size: 2 * Uint32Array.BYTES_PER_ELEMENT,
			usage:
				GPUBufferUsage.STORAGE |
				GPUBufferUsage.UNIFORM |
				GPUBufferUsage.COPY_DST |
				GPUBufferUsage.VERTEX,
			mappedAtCreation: true,
		});

		new Uint32Array(size_buffer.getMappedRange()).set([
			options.width,
			options.height
		]);

		size_buffer.unmap();

		const length = options.width * options.height;
		const empty_cells = new Uint32Array(length);

		cell_buffers.final[0] = device.createBuffer({
			size: empty_cells.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
			mappedAtCreation: true
		});

		new Uint32Array(cell_buffers.final[0].getMappedRange())
			.set(quarry_final_buffer);
		cell_buffers.final[0].unmap();

		cell_buffers.final[1] = device.createBuffer({
			size: empty_cells.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX
		});

		const volume = options.width * options.height * options.layers;
		const empty_layers_cells = new Uint32Array(volume);

		for (let z = 0; z < options.layers; z++) {
			for (let y = 0; y < options.height; y++) {
				for (let x = 0; x < options.width; x++) {
					const i = z * options.width * options.height + y * options.width + x;
					if (z === 1) {
						if (Math.random() <= 0.1) {
							empty_layers_cells[i] = 0xFF000000;
						} else {
							empty_layers_cells[i] = 0x00000000;
						}
					} else {
						if (Math.random() <= 0.1) {
							empty_layers_cells[i] = 0xFF2671df;
						} else {
							empty_layers_cells[i] = 0x00000000;
						}
					}
				}
			}
		}

		cell_buffers.layers[0] = device.createBuffer({
			size: empty_layers_cells.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
			mappedAtCreation: true
		});

		new Uint32Array(cell_buffers.layers[0].getMappedRange())
			.set(empty_layers_cells);
		cell_buffers.layers[0].unmap();

		cell_buffers.layers[1] = device.createBuffer({
			size: empty_layers_cells.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX
		});

		const game_state = {
			speed: 1
		};

		const game_state_buffer = device.createBuffer({
			size: 1 * Uint32Array.BYTES_PER_ELEMENT,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			mappedAtCreation: true,
		});

		new Uint32Array(game_state_buffer.getMappedRange()).set([
			game_state.speed
		]);

		game_state_buffer.unmap();

		window.addEventListener("mousedown", (e) => {
			if (e.button !== 0) return;

			game_state.speed += 4;

			e.preventDefault();

			device.queue.writeBuffer(
				game_state_buffer,
				0,
				new Uint32Array([game_state.speed]),
				0,
				1
			);

			setTimeout(() => {
				game_state.speed -= 4;	
				device.queue.writeBuffer(
					game_state_buffer,
					0,
					new Uint32Array([game_state.speed]),
					0,
					1
				);
			}, 100);
		});


		const bind_group0 = device.createBindGroup({
			layout: bind_group_layout_compute,
			entries: [
				{ binding: 0, resource: { buffer: size_buffer } },
				{ binding: 1, resource: { buffer: game_state_buffer } },
				{ binding: 2, resource: { buffer: cell_buffers.final[0] } },
				{ binding: 3, resource: { buffer: cell_buffers.final[1] } },
				{ binding: 4, resource: { buffer: cell_buffers.layers[0] } },
				{ binding: 5, resource: { buffer: cell_buffers.layers[1] } },
			]
		});

		const bind_group1 = device.createBindGroup({
			layout: bind_group_layout_compute,
			entries: [
				{ binding: 0, resource: { buffer: size_buffer } },
				{ binding: 1, resource: { buffer: game_state_buffer } },
				{ binding: 2, resource: { buffer: cell_buffers.final[1] } },
				{ binding: 3, resource: { buffer: cell_buffers.final[0] } },
				{ binding: 4, resource: { buffer: cell_buffers.layers[1] } },
				{ binding: 5, resource: { buffer: cell_buffers.layers[0] } },
			]
		});

		const render_pipeline = device.createRenderPipeline({
			layout: device.createPipelineLayout({
				bindGroupLayouts: [ bind_group_layout_render ]
			}),
			primitive: {
				topology: "triangle-strip",
			},
			vertex: {
				module: vertex_shader,
				buffers: [ cells_stride, square_stride ],
			},
			fragment: {
				module: fragment_shader,
				targets: [ { format: presentation_format } ]
			}
		});

		const uniform_bind_group = device.createBindGroup({
			layout: bind_group_layout_render,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: size_buffer,
						offset: 0,
						size: 2 * Uint32Array.BYTES_PER_ELEMENT
					}
				}
			]
		});

		let loop_count = 0;
		function render() {
			command_encoder = device.createCommandEncoder();
			const pass_encoder_compute = command_encoder.beginComputePass();
			pass_encoder_compute.setPipeline(compute_pipeline);
			pass_encoder_compute.setBindGroup(0, loop_count ? bind_group1 : bind_group0);
			pass_encoder_compute.dispatchWorkgroups(
				options.width / options.workgroup_size,
				options.height / options.workgroup_size,
				options.layers / options.workgroup_size,
			);
			pass_encoder_compute.end();

			const view = context.getCurrentTexture().createView();
			const pass_encoder_render = command_encoder.beginRenderPass({
				colorAttachments: [ { view, loadOp: "clear", storeOp: "store", } ]
			});

			pass_encoder_render.setPipeline(render_pipeline);
			pass_encoder_render.setVertexBuffer(
				0,
				loop_count
					? cell_buffers.final[1]
					: cell_buffers.final[0]
			);
			pass_encoder_render.setVertexBuffer(1, square_buffer);
			pass_encoder_render.setBindGroup(0, uniform_bind_group);
			pass_encoder_render.draw(4, length);
			pass_encoder_render.end();

			device.queue.submit([ command_encoder.finish() ]);
		}

		function loop() {
			render();
			loop_count++;
			if (loop_count >= options.timestep) {
				render();
				loop_count = 0;
			}
			requestAnimationFrame(loop);
		}

		loop();
	}
});