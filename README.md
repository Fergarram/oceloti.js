I think a good term for explaining the folder and file structure of this repository is thinking of it as a studio. A studio where you createa `blueprints` and have a `module` collection at hand.

Each `blueprint` specifies which `modules` it will need.

Each `blueprint` is in charge of defining the initial contents of the `room`.

When running the `build.js` script, it will generate the built `room` and replace it.

## Next steps:
- [ ] Create keyboard shortcuts module.

## Cool steps:
- [ ] Assistant use case: "shift all things about 300px to the right and top"
      An undo button would need to be implemented. The assistant has access to outerHTML and has context about the whole room setup.
- [ ] Shadow modes: top-down, wall
 
## Not urgent:
- [ ] Implement paste handler
- [ ] Movable shortcuts
- [ ] Compiler should only build modified blueprints.
- [ ] Add compiler option: make backups