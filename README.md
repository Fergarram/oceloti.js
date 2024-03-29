I think a good term for explaining the folder and file structure of this repository is thinking of it as a studio. A studio where you createa `blueprints` and have a `module` collection at hand.

Each `blueprint` specifies which `modules` it will need.

Each `blueprint` is in charge of defining the initial contents of the `room`.

When running the `build.js` script, it will generate the built `room` and replace it.

## Next steps:
- [ ] Handle file dropping (depends on image, etc item modules)
- [ ] Create an image thing module
- [ ] Create a link thing module

## UX Improv:
- [ ] Work on mobile UI and controls. Touch events...
- [ ] Add alternative transform-based zoom.
      NOTE: Doing `window.scrollX + e.clientX` is not going to work anymore.
      Ideally I should replace that behavior with a global variable that automatically calculates that for you based on zoom.
- [ ] Create keyboard shortcuts module.
- [ ] Add shadow performance option through equipment interface for thing-manager.

## Bugs:
- [ ] Inventory item invisible in Safari when dragging to room.

## Cool steps:
- [ ] Assistant use case: "shift everthing in the room about 300px to the right and top"
      An undo button would need to be implemented. The assistant has access to outerHTML and has context about the whole room setup.
- [ ] Shadow modes: top-down, wall
 
## Not urgent:
- [ ] Implement paste handler
- [ ] Movable shortcuts
- [ ] Compiler should only build modified blueprints.
- [ ] Add compiler option: make backups