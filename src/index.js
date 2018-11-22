const fs = require('fs');
const path = require('path');
const glob = require('glob');

const pluginName = 'VingWebpackPlugin';
const globalModules = ['store', 'route'];
const commonModules = ['filter', 'directive', 'plugin', 'mixin'];

const moduleOptions = [
  {
    name: 'store',
    path: '..', // str regexp
    fileName: 'store', // str regexp
    outputFileName: 'stores'
  },
  {
    name: 'route',
    path: '..', // str regexp
    fileName: 'route', // str regexp
    outputFileName: 'routes'
  },
  {
    name: 'filter',
    path: '..', // str regexp
    fileName: 'filter', // str regexp
    outputFileName: 'filters'
  },
  {
    name: 'directive',
    path: '..', // str regexp
    fileName: 'directive', // str regexp
    outputFileName: 'directives'
  },
  {
    name: 'plugin',
    path: '..', // str regexp
    fileName: 'plugin', // str regexp
    outputFileName: 'plugins'
  },
  {
    name: 'mixin',
    path: '..', // str regexp
    fileName: 'mixin', // str regexp
    outputFileName: 'mixins'
  }
]

class VingWebpackPlugin {
  constructor ({
    base = 'src',
    prefix = '@',
    types = moduleOptions.map(_ => ({ ..._, isGlobal: globalModules.includes(_.name) }))
  } = {}) {
    this.options = {
      base,
      prefix,
      types
    };
  }

  apply(compiler) {
    const generateAll = () => {
      moduleOptions.forEach(option => this.generate(option));
      this.generateEntry();
    };
    compiler.hooks.run.tap(pluginName, generateAll);
    compiler.hooks.watchRun.tap(pluginName, generateAll);
  }

  generate(option) {
    const code = this.createModule(option);
    updateFile(code, `../${option.outputFileName}.js`)
  }

  generateEntry () {
    const imports = this.types.map(_ => `import ${_.outputFileName} from './${_.outputFileName}'`).join('\n');
    const code = `${imports}export default { ${this.types.map(_ => _.name).join(',')} }`
    updateFile(code, '../index.js')
  }

  createImport(files) {
    const code = files.map(_ => `import ${_.key} from '${this.prefix}/${_.path}'`).join('\n');
    return code;
  }

  createModule({ name, isGlobal, outputFileName }) {
    const regex = new RegExp(`([^\/]*)\.${name}\.js`);
    const pathRegex = isGlobal ? `${this.base}/**/*.${name}.js` : `${this.base}/${outputFileName}/*.${name}.js`;
    const files = glob.sync(pathRegex).map(_ => {
      const key = regex.exec(_)[1]
      return {
        key,
        path: _.replace(this.base, '')
      }
    });
    const imports = this.createImport(files);
    const result = `{${files.map(_ => _.key).join(',')}}`;
    return `${imports}\n\nexport default ${result}`;
  }
}

function updateFile (code, filePath) {
  const to = path.resolve(__dirname, `${filePath}.js`);
  if (fs.existsSync(to) && fs.readFileSync(to, 'utf8').trim() === code) return;
  fs.writeFileSync(to, code);
}

module.exports = VingWebpackPlugin;