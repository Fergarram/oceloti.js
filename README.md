I think a good term for explaining the folder and file structure of this repository is thinking of it as a studio. A studio where you createa `blueprints` and have a `module` collection at hand.

Each `blueprint` specifies which `modules` it will need.

Each `blueprint` is in charge of defining the initial contents of the `room`.

When running the `build.js` script, it will generate the built `room` and replace it.

## Internals:
- [ ] Use indexeddb for saving room backups.
- [ ] Add base64 js-available assets `/modules/[module_name]/assets.json` for modules.
- [ ] Find a way to not remount or to not reload media/canvas/running things.

## UX Improv:
- [ ] Create clipboard handler module.
- [ ] Work on mobile UI and controls. Touch events...
- [ ] Add alternative transform-based zoom.
      NOTE: Doing `window.scrollX + e.clientX` is not going to work anymore.
      Ideally I should replace that behavior with a global variable that automatically calculates that for you based on zoom.
- [ ] Create keyboard shortcuts module.
- [ ] Add shadow performance option through equipment interface for thing-manager.

## Bugs:
- [ ] Inventory item invisible in Safari when dragging to room.
- [ ] Accumulating context menus. Look for @TODO in `context-menu.js`.

## Cool steps:
- [ ] Assistant use case: "shift everthing in the room about 300px to the right and top"
      An undo button would need to be implemented. The assistant has access to outerHTML and has context about the whole room setup.
- [ ] Shadow modes: floor (current), wall


---
1. move modules to separate script tags.

2. Start a module that serves as a module editor.

2a. The module editor is able to inspect style and script tags and is in charge of managing the oceloti state.

2b. The module editor should provide a text editor so that the content can be modified.

----

A document should be able to die store a new version (egg) in indexeddb or any storage medium and use that new version fresh so that it can then be saved as html manually.