fn unpack_color(color: u32) -> vec4<f32> {
    let r = f32(color & 0x000000FFu) / 255.0;
    let g = f32((color & 0x0000FF00u) >> 8) / 255.0;
    let b = f32((color & 0x00FF0000u) >> 16) / 255.0;
    let a = f32((color & 0xFF000000u) >> 24) / 255.0;
    return vec4<f32>(r, g, b, 1.0);
}

@fragment
fn main(@location(0) @interpolate(flat) cell: u32) -> @location(0) vec4f {
  return unpack_color(cell);
}
