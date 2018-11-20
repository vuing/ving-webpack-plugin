const fs = require('fs');
const path = require('path');
const glob = require('glob');

const pluginName = 'VingWebpackPlugin';
const fileTypes = ['store', 'route', 'filter', 'directive', 'plugin'];

class VingWebpackPlugin {
  constructor (options) {
    this.options = options;
  }

  apply(compiler) {
    const { types = fileTypes } = this.options || {};
    const generateAll = () => types.forEach(type => this.generate(type));
    compiler.hooks.run.tap(pluginName, generateAll);
    compiler.hooks.watchRun.tap(pluginName, generateAll);
  }

  generate(type) {
    const code = this.createModule(type)
    const to = path.resolve(__dirname, `./${type}s.js`);
    if (fs.existsSync(to) && fs.readFileSync(to, 'utf8').trim() === code) return;
    fs.writeFileSync(to, code);
  }

  createImport(files) {
    const code = files.map(_ => `import ${_.key} from '@/${_.path}'`).join('\n');
    return code;
  }

  createModule(type) {
    const regex = new RegExp(`([^\/]*)\.${type}\.js`);
    const files = glob.sync(`src/**/*.${type}.js`).map(_ => {
      const key = regex.exec(_)[1]
      return {
        key,
        path: _
      }
    });

    const imports = this.createImport(files);
    const result = `{${files.map(_ => _.key).join(',')}}`;
    return `${imports}\n\nexport default ${result}`;
  }
}

module.exports = VingWebpackPlugin;