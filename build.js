const fs = require('fs');
const path = require('path');

const modules_dir = './modules';
const output_dir = './rooms';
const blueprints_dir = './blueprints';
const styles_placeholder = '/* STYLE MODULES */';
const scripts_placeholder = '/* SCRIPT MODULES */';

fs.readdirSync(blueprints_dir, { withFileTypes: true }).forEach(dirent => {
    if (dirent.isFile() && dirent.name.endsWith('.html')) {

        let style_modules = '';
        let js_modules = '';

        fs.readdirSync(modules_dir, { withFileTypes: true }).forEach(module_dirent => {
            const module_path = path.join(modules_dir, module_dirent.name);
            
            if (module_dirent.isDirectory()) {
                
                fs.readdirSync(module_path).forEach(file => {
                    const file_path = path.join(module_path, file);
                
                    if (file.endsWith('.css')) {
                        style_modules += `/* MODULE: ${file_path} */\n`;
                        style_modules += fs.readFileSync(file_path, 'utf8') + "\n";
                
                    } else if (file.endsWith('.js')) {
                        js_modules += `/* MODULE: ${file_path} */\n{\n`;
                        js_modules += fs.readFileSync(file_path, 'utf8') + "\n}\n";
                    }
                });
            }
        });

        const blueprint_path = path.join(blueprints_dir, dirent.name);
        let html_content = fs.readFileSync(blueprint_path, 'utf8');

        html_content = html_content.replace(styles_placeholder, style_modules);
        html_content = html_content.replace(scripts_placeholder, js_modules);

        const output_html = path.join(output_dir, dirent.name);

        fs.writeFileSync(output_html, html_content);

        console.log(`HTML file ${dirent.name} has been processed and saved to ${output_html}`);
    }
});
