const sand = vec4f(1.0, 0.91, 0.58, 1.);
const worker = vec4f(0.0, 0.0, 0.0, 1.);
const sky = vec4f(0.357, 0.722, 1.0, 1.);
const stone0_internal = vec4f(0.533, 0.31, 0.09, 1.);
const stone0_external = vec4f(1.0, 0.761, 0.522, 1.);
const quarry0_0 = vec4f(0.875, 0.443, 0.149, 1.);

// @STEP: The cell will have the color anyway, we'll just need to extract it with bitwise operations.

@fragment
fn main(@location(0) cell: f32) -> @location(0) vec4f {
  return select(sand, worker, cell == 1.);
}
