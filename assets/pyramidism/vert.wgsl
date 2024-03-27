struct Out {
  @builtin(position) pos: vec4f,
  @location(0) @interpolate(flat) cell: u32,
}

@binding(0) @group(0) var<uniform> size: vec2u;

@vertex
fn main(
  @builtin(instance_index) i: u32,
  @location(0) cell: u32,
  @location(1) pos: vec2u
) -> Out {
  let w = size.x;
  let h = size.y;
  
  let x = (f32(i % w + pos.x) / f32(w) - 0.5) * 2.;
  let y = (f32((i - (i % w)) / w + pos.y) / f32(h) - 0.5) * 2.;
  
  return Out(vec4f(x, y, 0., 1.), u32(cell));
}