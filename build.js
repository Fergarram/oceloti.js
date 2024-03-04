const fs = require('fs');
const path = require('path');

const modules_dir = './modules';
const output_dir = './rooms';
const blueprints_dir = './blueprints';
const assets_placeholder = '/* STATIC ASSETS */';
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

function extract(html_string, type) {
    let regex;
    switch(type) {
        case "styles":
            regex = /<style[^>]*oceloti-modules="([^"]*)"/;
            break;
        case "scripts":
            regex = /<script[^>]*oceloti-modules="([^"]*)"/;
            break;
        case "assets":
            regex = /<style[^>]*oceloti-assets="([^"]*)"/;
            break;
    }

    const matches = html_string.match(regex);

    if (matches && matches[1]) {
        return matches[1].trim().split(/\s+/);
    } else {
        return [];
    }
}

function get_files_recursively(dir) {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    const files = dirents.flatMap((dirent) => {
        const res = `${dir}/${dirent.name}`;
        return dirent.isDirectory() ? get_files_recursively(res) : res;
    });
    return files;
}

async function encode_asset(file_path) {
    return new Promise((resolve, reject) => {
        const extension = path.extname(file_path).toLowerCase();
        let mime_type;

        switch (extension) {
            case '.png':
                mime_type = 'image/png';
                break;
            case '.jpg':
            case '.jpeg':
                mime_type = 'image/jpeg';
                break;
            case '.gif':
                mime_type = 'image/gif';
                break;
            case '.svg':
                mime_type = 'image/svg+xml';
                break;
            case '.webp':
                mime_type = 'image/webp';
                break;
            default:
                return reject(`Unsupported file type: ${file_path}`);
        }

        fs.readFile(file_path, (err, data) => {
            if (err) {
                return reject(err);
            }
            const base64_data = data.toString('base64');
            resolve(`data:${mime_type};base64,${base64_data}`);
        });
    });
}

function generate_rooms() {
    fs.readdirSync(blueprints_dir, { withFileTypes: true }).forEach(async (dirent) => {
        if (dirent.isFile() && dirent.name.endsWith('.html')) {

            const blueprint_path = path.join(blueprints_dir, dirent.name);
            let html_content = fs.readFileSync(blueprint_path, 'utf8');

            let stringified_assets = '';
            let stringified_styles = '';
            let stringified_scripts = '';

            const style_assets = extract(html_content, "assets");
            const style_modules = extract(html_content, "styles");
            const script_modules = extract(html_content, "scripts");

            if (style_assets[0] === "*") {
                console.log("\x1b[33mCAUTION: All assets are being imported.\x1b[0m");
                const files = get_files_recursively("./assets");
                console.log(files);
                if (files && files.length > 0) {
                    stringified_assets += ":root {\n"
                }
                for (const file of files) {
                    try {
                        const encoded_asset = await encode_asset(file);
                        const var_name = file.replaceAll(".", "-").replaceAll("/", "-");
                        stringified_assets += `${var_name}: url('${encoded_asset}');\n`;
                        console.log("Encoded", file);
                    } catch(e) {
                        console.log(`\x1b[1;31mERROR: ${e}\x1b[0m`);
                    }
                }
                if (files && files.length > 0) {
                    stringified_assets += "}"
                }
                console.log("");
            } else {
                style_assets.forEach((asset_path) => {

                });
            }

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

            html_content = html_content.replace(assets_placeholder, stringified_assets);
            html_content = html_content.replace(styles_placeholder, stringified_styles);
            html_content = html_content.replace(scripts_placeholder, stringified_scripts);

            const output_html = path.join(output_dir, dirent.name);

            fs.writeFileSync(output_html, html_content);
            console.log("Created:", dirent.name);
        }
    });
}
