const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

const pluginName = 'VingWebpackPlugin';
const moduleOptions = [
  {
    name: 'store',
    isGlobal: true
  },
  {
    name: 'route',
    isGlobal: true
  },
  {
    name: 'filter'
  },
  {
    name: 'directive'
  },
  {
    name: 'plugin'
  },
  {
    name: 'mixin'
  }
];

class VingWebpackPlugin {
  constructor ({
    base = 'src',
    prefix = '@',
    types = moduleOptions
  } = {}) {
    types = this.normalizeTypes(types);
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

  createModule({ name, path, isGlobal, outputFileName }) {
    const regex = new RegExp(`([^\/]*)\.${name}\.js`);
    const pathRegex = path
      ? path
      : isGlobal
      ? `${this.base}/**/*.${name}.js`
      : `${this.base}/${outputFileName}/*.${name}.js`;
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

  normalizeTypes (types) {
    return types.map(({
      name,
      isGlobal = false,
      fileName = name,
      outputFileName = `${fileName}s`,
      path
    }) => {
      if (!name) {
        console.log(chalk.red('Name is needed in Type!'));
        process.exit();
      }
      path = path
        ? path
        : isGlobal
        ? `${this.base}/**/*.${name}.js`
        : `${this.base}/${outputFileName}/*.${name}.js`;
      return { name, isGlobal, fileName, outputFileName, path }
    })
  }
}

function updateFile (code, filePath) {
  const to = path.resolve(__dirname, `${filePath}.js`);
  if (fs.existsSync(to) && fs.readFileSync(to, 'utf8').trim() === code) return;
  fs.writeFileSync(to, code);
}

module.exports = VingWebpackPlugin;