@binding(0) @group(0) var<storage, read> size: vec2u;
@binding(1) @group(0) var<storage, read> game_state: array<u32>;

@binding(2) @group(0) var<storage, read> current: array<u32>;
@binding(3) @group(0) var<storage, read_write> next: array<u32>;

@binding(4) @group(0) var<storage, read> current_layers: array<u32>;
@binding(5) @group(0) var<storage, read_write> next_layers: array<u32>;

override block_size = 8;

override layers_count: u32 = 8;

const transparent = 0x00000000;
const white = 0xFFFFFFFF;
const sand = 0xFF94E8FF;
const worker = 0xFF000000;
const worker_moving = 0xF1FFFFFF;
const sky = 0xFFb8ff5b;
const stone0 = 0xFF2671df;

fn unpack_color(color: u32) -> vec4<f32> {
    let r = f32(color & 0x000000FFu) / 255.0;
    let g = f32((color & 0x0000FF00u) >> 8) / 255.0;
    let b = f32((color & 0x00FF0000u) >> 16) / 255.0;
    let a = f32((color & 0xFF000000u) >> 24) / 255.0;
    return vec4<f32>(r, g, b, a);
}

fn get_index_2d(x: u32, y: u32) -> u32 {
  let h = size.y;
  let w = size.x;

  return (y % h) * w + (x % w);
}

fn get_index_3d(x: u32, y: u32, z: u32) -> u32 {
  let h = size.y;
  let w = size.x;

  return (z % layers_count) * w * h + (y % h) * w + (x % w);
}

fn get_render_cell(x: u32, y: u32) -> u32 {
  return current[get_index_2d(x, y)];
}

fn get_layer_cell(x: u32, y: u32, z: u32) -> u32 {
  return current_layers[get_index_3d(x, y, z)];
}

fn surrounded_by(x: u32, y: u32, z: u32, cell_type: u32) -> bool {
  return get_layer_cell(x + 1, y, z) == cell_type &&
    get_layer_cell(x - 1, y, z) == cell_type &&
    get_layer_cell(x, y + 1, z) == cell_type &&
    get_layer_cell(x, y - 1, z) == cell_type &&
    get_layer_cell(x + 1, y + 1, z) == cell_type &&
    get_layer_cell(x - 1, y - 1, z) == cell_type &&
    get_layer_cell(x + 1, y - 1, z) == cell_type &&
    get_layer_cell(x - 1, y + 1, z) == cell_type;
}

fn get_cross_neighbors(x: u32, y: u32, cell_type: u32) -> bool {
  return
    get_layer_cell(x + 1, y + 1, 1) == cell_type
    && get_layer_cell(x - 1, y - 1, 1) == cell_type
    && get_layer_cell(x + 1, y - 1, 1) == cell_type
    && get_layer_cell(x - 1, y + 1, 1) == cell_type;
}

fn get_neighbor_count(x: u32, y: u32, z: u32, cell_type: u32) -> u32 {
  return
    select(u32(0), u32(1), get_layer_cell(x + 1, y, z) == cell_type) +
    select(u32(0), u32(1), get_layer_cell(x - 1, y, z) == cell_type) +
    select(u32(0), u32(1), get_layer_cell(x, y + 1, z) == cell_type) +
    select(u32(0), u32(1), get_layer_cell(x, y - 1, z) == cell_type) +
    select(u32(0), u32(1), get_layer_cell(x + 1, y + 1, z) == cell_type) +
    select(u32(0), u32(1), get_layer_cell(x - 1, y - 1, z) == cell_type) +
    select(u32(0), u32(1), get_layer_cell(x + 1, y - 1, z) == cell_type) +
    select(u32(0), u32(1), get_layer_cell(x - 1, y + 1, z) == cell_type);
}

@compute @workgroup_size(block_size, block_size, block_size)
fn main(@builtin(global_invocation_id) grid: vec3u) {
  let worker_move_speed: u32 = 1; //game_state[0];

  let x = grid.x;
  let y = grid.y;
  let z = grid.z;

  if (z == 0) {

    //
    // Merge layers
    //

    // First pass - ground layer
    next[get_index_2d(x, y)] = get_layer_cell(x, y, 0);

    // Second pass - worker layer
    if (get_layer_cell(x, y, 1) == worker || get_layer_cell(x, y, 1) == worker_moving) {
      next[get_index_2d(x, y)] = get_layer_cell(x, y, 1);
    }

    //
    // Update next generation of cells
    //

    next_layers[get_index_3d(x, y, 1)] = get_layer_cell(x, y, 1);


    //
    // Worker logic
    //

    if (get_layer_cell(x,y,1) == worker) {
      if (
        surrounded_by(x, y, 0, sand) &&
        (
          get_layer_cell(x - worker_move_speed, y, 1) == white ||
          get_layer_cell(x - worker_move_speed, y, 1) == worker_moving
        )
      ) {
        next_layers[get_index_3d(x, y, 1)] = worker_moving;
        next_layers[get_index_3d(x - worker_move_speed, y, 1)] = worker;
      }
      if (get_cross_neighbors(x, y, worker)) {
        next_layers[get_index_3d(x, y, 1)] = white;
      }
    }

    if (get_layer_cell(x,y,1) == worker_moving) {
      if (get_cross_neighbors(x, y, worker_moving)) {
        next_layers[get_index_3d(x, y, 1)] = white;
      }
      if (get_neighbor_count(x, y, 1, worker) == 0) {
        next_layers[get_index_3d(x, y, 1)] = white;
      }
    }
  }
}
