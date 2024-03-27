@binding(0) @group(0) var<storage, read> size: vec2u;
@binding(1) @group(0) var<storage, read> current: array<u32>;
@binding(2) @group(0) var<storage, read_write> next: array<u32>;
@binding(3) @group(0) var<storage> game_state: array<u32>;

override block_size = 8;

const sand = 0xFF94E8FF;
const worker = 0xFF000000;
const past_worker = 0xFF40E8FF;
const sky = 0xFFb8ff5b;
const stone0 = 0xFF2671df;

fn unpack_color(color: u32) -> vec4<f32> {
    let r = f32(color & 0x000000FFu) / 255.0;
    let g = f32((color & 0x0000FF00u) >> 8) / 255.0;
    let b = f32((color & 0x00FF0000u) >> 16) / 255.0;
    let a = f32((color & 0xFF000000u) >> 24) / 255.0;
    return vec4<f32>(r, g, b, a);
}

fn get_index(x: u32, y: u32) -> u32 {
  let h = size.y;
  let w = size.x;

  return (y % h) * w + (x % w);
}

fn get_cell(x: u32, y: u32) -> u32 {
  return current[get_index(x, y)];
}

@compute @workgroup_size(block_size, block_size)
fn main(@builtin(global_invocation_id) grid: vec3u) {
  let x = grid.x;
  let y = grid.y;

  next[get_index(x,y)] = get_cell(x,y);
  
  if (get_cell(x,y) == worker) {
    next[get_index(x,y)] = sand;
  }

  if (get_cell(x,y) == sand) {
    if (get_cell(x-game_state[0],y) == worker) {
      next[get_index(x,y)] = worker;
    }
  }
} 
