I think a good term for explaining the folder and file structure of this repository is thinking of it as a studio. A studio where you createa `blueprints` and have a `module` collection at hand.

Each `blueprint` specifies which `modules` it will need.

Each `blueprint` is in charge of defining the initial contents of the `room`.

When running the `build.js` script, it will generate the built `room` and replace it.

## TODO

Important:
- [ ] Implement context menu groups
 
Not urgent:
- [ ] Compiler should only build modified blueprints.
- [ ] Add compiler option: make backups