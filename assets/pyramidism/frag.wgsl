const sand = vec4f(1.0, 0.91, 0.58, 1.);
const worker = vec4f(0.0, 0.0, 0.0, 1.);
const sky = vec4f(0.357, 0.722, 1.0, 1.);
const stone0_internal = vec4f(0.533, 0.31, 0.09, 1.);
const stone0_external = vec4f(1.0, 0.761, 0.522, 1.);
const quarry0_0 = vec4f(0.875, 0.443, 0.149, 1.);


fn unpack_color(color: u32) -> vec4<f32> {
    let r = f32(color & 0x000000FFu) / 255.0;
    let g = f32((color & 0x0000FF00u) >> 8) / 255.0;
    let b = f32((color & 0x00FF0000u) >> 16) / 255.0;
    let a = f32((color & 0xFF000000u) >> 24) / 255.0;
    return vec4<f32>(r, g, b, a);
}

@fragment
fn main(@location(0) @interpolate(flat) cell: u32) -> @location(0) vec4f {
  return unpack_color(cell);
}
