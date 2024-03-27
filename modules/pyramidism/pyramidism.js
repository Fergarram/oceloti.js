register_oceloti_module({
	name: "pyramidism",
	deps: ["van"],
	init: async ({ use_module, room, room_name, next_loop }) => {
		const van = use_module("van");

		const options = {
		  width: 1111,
		  height: 666,
		  timestep: 2,
		  workgroup_size: 1,
		};
		
		let res = await fetch("../assets/pyramidism/compute.wgsl");
		const compute_program = await res.text();
		res = await fetch("../assets/pyramidism/frag.wgsl");
		const frag_program = await res.text();
		res = await fetch("../assets/pyramidism/vert.wgsl");
		const vert_program = await res.text();

		res = await fetch("../assets/pyramidism/quarry_left_empty.png");
		const blob = await res.blob();
		const bitmap = await createImageBitmap(blob);
		const bitmap_canvas = new OffscreenCanvas(1, 1);
		bitmap_canvas.width = options.width;
		bitmap_canvas.height = options.height;
		const bitmap_canvas_context = bitmap_canvas.getContext("2d");
		bitmap_canvas_context.scale(1, -1);
		bitmap_canvas_context.drawImage(bitmap, 0, -1 * options.height);

		const image_content = bitmap_canvas_context.getImageData(
			0, 0, options.width, options.height
		);
    	
    	const quarry_buffer = new Uint32Array(image_content.data.buffer);


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

		const bind_group_layout_compute = device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.COMPUTE,
					buffer: {
						type: "read-only-storage",
					},
				},
				{
					binding: 1,
					visibility: GPUShaderStage.COMPUTE,
					buffer: {
						type: "read-only-storage",
					},
				},
				{
					binding: 2,
					visibility: GPUShaderStage.COMPUTE,
					buffer: {
						type: "storage",
					},
				},
				{
					binding: 3,
					visibility: GPUShaderStage.COMPUTE,
					buffer: {
						type: "read-only-storage",
					},
				},
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
		let buffer0;
		let buffer1;

		const compute_pipeline = device.createComputePipeline({
			layout: device.createPipelineLayout({
				bindGroupLayouts: [ bind_group_layout_compute ]
			}),
			compute: {
				module: compute_shader,
				constants: {
					block_size: options.workgroup_size
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
		const cells = quarry_buffer;

		buffer0 = device.createBuffer({
			size: cells.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
			mappedAtCreation: true
		});

		new Uint32Array(buffer0.getMappedRange()).set(cells);
		buffer0.unmap();

		buffer1 = device.createBuffer({
			size: cells.byteLength,
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
				{ binding: 1, resource: { buffer: buffer0 } },
				{ binding: 2, resource: { buffer: buffer1 } },
				{ binding: 3, resource: { buffer: game_state_buffer } },
			]
		});

		const bind_group1 = device.createBindGroup({
			layout: bind_group_layout_compute,
			entries: [
				{ binding: 0, resource: { buffer: size_buffer } },
				{ binding: 1, resource: { buffer: buffer1 } },
				{ binding: 2, resource: { buffer: buffer0 } },
				{ binding: 3, resource: { buffer: game_state_buffer } },
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
				options.height / options.workgroup_size
			);
			pass_encoder_compute.end();

			const view = context.getCurrentTexture().createView();
			const pass_encoder_render = command_encoder.beginRenderPass({
				colorAttachments: [ { view, loadOp: "clear", storeOp: "store", } ]
			});

			pass_encoder_render.setPipeline(render_pipeline);
			pass_encoder_render.setVertexBuffer(0, loop_count ? buffer1 : buffer0);
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