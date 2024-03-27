register_oceloti_module({
	name: "pyramidism",
	deps: ["van"],
	init: async ({ use_module, room, room_name, next_loop }) => {
		const van = use_module("van");
		
		let res = await fetch("../assets/pyramidism/compute.wgsl");
		const compute_program = await res.text();
		res = await fetch("../assets/pyramidism/frag.wgsl");
		const frag_program = await res.text();
		res = await fetch("../assets/pyramidism/vert.wgsl");
		const vert_program = await res.text();

		// @STEP 1: Load initial map states from images.

		const options = {
		  width: 1111,
		  height: 666,
		  timestep: 1,
		  workgroup_size: 8,
		};

		const thing = room.querySelector(`[oceloti-thing="pyramidism-canvas"]`);
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
		})

		const compute_shader = device.createShaderModule({ code: compute_program });
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

		const vertex_shader = device.createShaderModule({ code: vert_program });
		const fragment_shader = device.createShaderModule({ code: frag_program });

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
		let whole_time = 0;
		let loop_times = 0;
		
		// @STEP 2: I'll need more buffers for each room and each layer.
		//        This is one of the trickier parts because I need a setup
		//        that allows me to easily manage and add layers.
		//        For now, only do 1 room but with multiple layers.
		let buffer0;
		let buffer1;
		
		let render;

		function reset_game_data() {
			const compute_pipeline = device.createComputePipeline({
				layout: device.createPipelineLayout({
					bindGroupLayouts: [ bind_group_layout_compute ]
				}),
				compute: {
					module: compute_shader,
					constants: {
						blockSize: options.workgroup_size
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
				mappedAtCreation: true
			});

			new Uint32Array(size_buffer.getMappedRange()).set([
				options.width,
				options.height
			]);

			size_buffer.unmap();

			const length = options.width * options.height;
			const cells = new Uint32Array(length);

			// @STEP 3: Replace with code that converts pixel color from image map to 0x000000FF format for the first layer only.
			for (let i = 0; i < length; i++) {
				cells[i] = Math.random() < 0.25 ? 1 : 0;
			}

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

			const bind_group0 = device.createBindGroup({
				layout: bind_group_layout_compute,
				entries: [
					{ binding: 0, resource: { buffer: size_buffer } },
					{ binding: 1, resource: { buffer: buffer0 } },
					{ binding: 2, resource: { buffer: buffer1 } },
				]
			});

			const bind_group1 = device.createBindGroup({
				layout: bind_group_layout_compute,
				entries: [
					{ binding: 0, resource: { buffer: size_buffer } },
					{ binding: 1, resource: { buffer: buffer1 } },
					{ binding: 2, resource: { buffer: buffer0 } },
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
					targets: [
						{
							format: presentation_format
						}
					]
				}
			});

			const uniform_bind_group = device.createBindGroup({
				layout: render_pipeline.getBindGroupLayout(0),
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

			loop_times = 0;
			render = () => {
				const view = context.getCurrentTexture().createView();
				const render_pass = {
					colorAttachments: [
						{
							view,
							loadOp: "clear",
							storeOp: "store",
						}
					]
				};
				command_encoder = device.createCommandEncoder();

				const pass_encoder_compute = command_encoder.beginComputePass();
				pass_encoder_compute.setPipeline(compute_pipeline);
				pass_encoder_compute.setBindGroup(0, loop_times ? bind_group1 : bind_group0);
				pass_encoder_compute.dispatchWorkgroups(
					options.width / options.workgroup_size,
					options.height / options.workgroup_size
				);
				pass_encoder_compute.end();

				const pass_encoder_render = command_encoder.beginRenderPass(render_pass);
				pass_encoder_render.setPipeline(render_pipeline);
				pass_encoder_render.setVertexBuffer(0, loop_times ? buffer1 : buffer0);
				pass_encoder_render.setVertexBuffer(1, square_buffer);
				pass_encoder_render.setBindGroup(0, uniform_bind_group);
				pass_encoder_render.draw(4, length);
				pass_encoder_render.end();

				device.queue.submit([ command_encoder.finish() ]);
			};
		}

		reset_game_data();

		function loop() {
			if (options.timestep) {
				whole_time++;
				if (whole_time >= options.timestep) {
					render();
					whole_time -= options.timestep;
					loop_times = 1 - loop_times;
				}
			}

			requestAnimationFrame(loop);
		}

		loop();
	}
});