@binding(0) @group(0) var<storage, read> size: vec2u;
@binding(1) @group(0) var<storage, read> game_state: array<u32>;

@binding(2) @group(0) var<storage, read> current: array<u32>;
@binding(3) @group(0) var<storage, read_write> next: array<u32>;

@binding(4) @group(0) var<storage, read> current_layers: array<u32>;
@binding(5) @group(0) var<storage, read_write> next_layers: array<u32>;

@binding(6) @group(0) var<storage, read> random: array<u32>;

override block_size = 8;

override layers_count: u32 = 8;

const none = 0x00000000;
const white = 0xFFFFFFFF;
const sand = 0xFF94E8FF;
const sky = 0xFFb8ff5b;
const stone0 = 0xFF2671df;

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

fn get_random(x: u32, y: u32) -> vec4<f32> {
  let pixel = random[get_index_2d(x, y)];
  let r = f32(pixel & 0x000000FFu) / 255.0;
  let g = f32((pixel & 0x0000FF00u) >> 8) / 255.0;
  let b = f32((pixel & 0x00FF0000u) >> 16) / 255.0;
  let a = f32((pixel & 0xFF000000u) >> 24) / 255.0;
  return vec4<f32>(r, g, b, a);
}

fn get_random_state(x: u32, y: u32, num_states: u32) -> u32 {
  let random_value = get_random(x, y);
  let state_threshold = 1.0 / f32(num_states);

  for (var i: u32 = 0u; i < num_states; i = i + 1u) {
    if (random_value.r < f32(i + 1u) * state_threshold) {
      return i;
    }
  }

  return num_states - 1u;
}

fn get_render_cell(x: u32, y: u32) -> u32 {
  return current[get_index_2d(x, y)];
}

fn get_layer_cell(x: u32, y: u32, z: u32) -> u32 {
  return current_layers[get_index_3d(x, y, z)];
}

fn get_next_layer_cell(x: u32, y: u32, z: u32) -> u32 {
  return next_layers[get_index_3d(x, y, z)];
}

fn is_surrounded_by(x: u32, y: u32, z: u32, cell_type: u32) -> bool {
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

fn is_neighbor_around(x: u32, y: u32, z: u32, cell_type: u32) -> bool {
  return get_layer_cell(x + 1, y, z) == cell_type ||
    get_layer_cell(x - 1, y, z) == cell_type ||
    get_layer_cell(x, y + 1, z) == cell_type ||
    get_layer_cell(x, y - 1, z) == cell_type ||
    get_layer_cell(x + 1, y + 1, z) == cell_type ||
    get_layer_cell(x - 1, y - 1, z) == cell_type ||
    get_layer_cell(x + 1, y - 1, z) == cell_type ||
    get_layer_cell(x - 1, y + 1, z) == cell_type;
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

fn selfi(x: u32, y: u32, layer: u32) -> u32 {
  return get_index_3d(x, y, layer);
}

// Worker goal states
const worker_idle        = 0x01000000;
const worker_find_quarry = 0x02000000;
const worker_mine        = 0x03000000;

// Worker move directions
const worker_go  = 0x20000000;
const worker_go_l  = 0x21000000;
const worker_go_bl = 0x22000000;
const worker_go_tl = 0x23000000;
// const worker_go_r  = 0x24000000;
// const worker_go_br = 0x25000000;
// const worker_go_tr = 0x26000000;
const worker_will_move = 0x03FFFFFF;

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
    if (get_layer_cell(x, y, 2) != none) {
      next[get_index_2d(x, y)] = get_layer_cell(x, y, 2);
    }

    // Debug pass - worker
    // if (get_layer_cell(x, y, 1) != none) {
      // next[get_index_2d(x, y)] = get_layer_cell(x, y, 1);
    // }
    // next[get_index_2d(x, y)] = random[get_index_2d(x, y)];


    

    //
    // Update next generation of cells
    //

    next_layers[selfi(x,y,1)] = get_layer_cell(x, y, 1);
    next_layers[selfi(x,y,2)] = get_layer_cell(x, y, 2);

    //
    // Workers
    //

    {
      if (
        get_layer_cell(x,y,2) == worker_find_quarry &&
        get_layer_cell(x,y,1) == worker_go
      ) {
        let state = get_random_state(x, y, 3u);
        if (state == 0) {
          next_layers[selfi(x,y,1)] = worker_go_l;
        } else if (state == 1) {
          next_layers[selfi(x,y,1)] = worker_go_bl;
        } else if (state == 2) {
          next_layers[selfi(x,y,1)] = worker_go_tl;
        }
      }

      if (get_layer_cell(x, y, 0) == sand) {
        
        if (get_layer_cell(x,y,1) == none) {
          if (get_layer_cell(x + 1, y, 1) == worker_go_l) {
            next_layers[selfi(x,y,1)] = worker_will_move;
          }
          if (get_layer_cell(x + 1, y + 1, 1) == worker_go_bl) {
            next_layers[selfi(x,y,1)] = worker_will_move;
          }
          if (get_layer_cell(x + 1, y - 1, 1) == worker_go_tl) {
            next_layers[selfi(x,y,1)] = worker_will_move;
          }
        }

        if (
          get_layer_cell(x,y,1) == worker_go_l &&
          get_layer_cell(x - 1, y, 1) == worker_will_move
        ) {
          next_layers[selfi(x,y,1)] = none;
          next_layers[selfi(x,y,2)] = none;
        }

        if (
          get_layer_cell(x,y,1) == worker_go_bl &&
          get_layer_cell(x - 1, y - 1, 1) == worker_will_move
        ) {
          next_layers[selfi(x,y,1)] = none;
          next_layers[selfi(x,y,2)] = none;
        }

        if (
          get_layer_cell(x,y,1) == worker_go_tl &&
          get_layer_cell(x - 1, y + 1, 1) == worker_will_move
        ) {
          next_layers[selfi(x,y,1)] = none;
          next_layers[selfi(x,y,2)] = none;
        }

        if (get_layer_cell(x,y,1) == worker_will_move) {
          next_layers[selfi(x,y,1)] = worker_go;
          next_layers[selfi(x,y,2)] = worker_find_quarry;
        }
      }
    }
  }
}
