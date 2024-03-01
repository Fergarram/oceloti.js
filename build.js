const fs = require('fs');
const path = require('path');

const modules_dir = './modules';
const output_dir = './rooms';
const blueprints_dir = './blueprints';
const styles_placeholder = '/* STYLE MODULES */';
const scripts_placeholder = '/* SCRIPT MODULES */';

console.log("Building rooms...\n=================");
generate_rooms();

console.log("\nWatching for changes in modules or blueprints.\n")

fs.watch(blueprints_dir, debounce((event_type, filename) => {
    generate_rooms();
}));

fs.readdirSync(modules_dir, { withFileTypes: true }).forEach(module_dirent => {
    if (module_dirent.isDirectory()) {
        const module_path = path.join(modules_dir, module_dirent.name);
        fs.watch(module_path, debounce((event_type, filename) => {
            generate_rooms();
        }));
    }
});

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function extract_modules(html_string, type) {
  const regex = type === "styles" 
    ? /<style[^>]*oceloti-modules="([^"]*)"/
    : /<script[^>]*oceloti-modules="([^"]*)"/;
  const matches = html_string.match(regex);

  // Check if we found a match
  if (matches && matches[1]) {
    // Split the contents of the attribute by spaces to get an array of module names
    const modules = matches[1].trim().split(/\s+/);
    return modules;
  } else {
    // Return an empty array if no oceloti-modules attribute was found
    return [];
  }
}

function generate_rooms() {
    fs.readdirSync(blueprints_dir, { withFileTypes: true }).forEach(dirent => {
        if (dirent.isFile() && dirent.name.endsWith('.html')) {

            const blueprint_path = path.join(blueprints_dir, dirent.name);
            let html_content = fs.readFileSync(blueprint_path, 'utf8');

            let stringified_styles = '';
            let stringified_scripts = '';

            const style_modules = extract_modules(html_content, "styles")
            const script_modules = extract_modules(html_content, "scripts")

            style_modules.forEach((module_name) => {
                const module_path = `${modules_dir}/${module_name}`;
                fs.readdirSync(module_path).forEach(file => {
                    const file_path = path.join(module_path, file);
                
                    if (file.endsWith('.css')) {
                        stringified_styles += `/* MODULE: ${file_path} */\n`;
                        stringified_styles += fs.readFileSync(file_path, 'utf8') + "\n";
                    }
                });
            });

            script_modules.forEach((module_name) => {
                const module_path = `${modules_dir}/${module_name}`;
                fs.readdirSync(module_path).forEach(file => {
                    const file_path = path.join(module_path, file);
                    if (file.endsWith('.js')) {
                        stringified_scripts += `/* MODULE: ${file_path} */\n`;
                        stringified_scripts += fs.readFileSync(file_path, 'utf8') + "\n";
                    }
                });
            });

            html_content = html_content.replace(styles_placeholder, stringified_styles);
            html_content = html_content.replace(scripts_placeholder, stringified_scripts);

            const output_html = path.join(output_dir, dirent.name);

            fs.writeFileSync(output_html, html_content);
            console.log("Created:", dirent.name);
        }
    });
}
