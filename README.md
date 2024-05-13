I think a good term for explaining the folder and file structure of this repository is thinking of it as a studio. A studio where you createa `blueprints` and have a `module` collection at hand.

Each `blueprint` specifies which `modules` it will need.

Each `blueprint` is in charge of defining the initial contents of the `room`.

When running the `build.js` script, it will generate the built `room` and replace it.

## Internals:
- [ ] Use indexeddb for saving room backups.
- [ ] Add base64 js-available assets `/modules/[module_name]/assets.json` for modules.
- [ ] Find a way to not remount or to not reload media/canvas/running things.
- [ ] Create keyboard shortcuts module.

## UX Improv:
- [ ] Create clipboard handler module.
- [ ] Work on mobile UI and controls. Touch events...
- [ ] Add alternative transform-based zoom.
      NOTE: Doing `window.scrollX + e.clientX` is not going to work anymore.
      Ideally I should replace that behavior with a global variable that automatically calculates that for you based on zoom.
- [ ] Add shadow performance option through equipment interface for thing-manager.

## Bugs:
- [ ] Inventory item invisible in Safari when dragging to room.
- [ ] Accumulating context menus. Look for @TODO in `context-menu.js`.

## Cool steps:
- [ ] Assistant use case: "shift everthing in the room about 300px to the right and top"
      An undo button would need to be implemented. The assistant has access to outerHTML and has context about the whole room setup.
- [ ] Shadow modes: floor (current), wall