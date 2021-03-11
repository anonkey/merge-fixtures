#!/usr/bin/env node

const yaml = require('js-yaml');
const fs = require('fs');
const path = require( 'path' );
const kebabCase = require('kebab-case');
const {walk} = require('./walk');

const fixturesPath = process.argv[2];
let outDir = process.argv[3];

if (!fixturesPath) {
  console.log('Need fixturesPaths');
  return 3;
}
if (!outDir) {
  outDir = fixturesPath;
}

const fromDir = fs.realpathSync(fixturesPath);
const fixtures = {};

const storeFixtures = (fileData) => {
  Object.entries(fileData).forEach(([key, value]) => {
    console.log(`load ${key}`);
    fixtures[key] = {
      ...(fixtures[key] || {}),
      ...(value || {}),
    };
  });
};

const loadFile = async (fromPath) => {
  console.log( 'Load \'%s\'', fromPath );

  const fileData = await fs.promises.readFile(fromPath, 'utf8');

  const fixturesYaml = yaml.load(fileData, {json: true});
  if (fixturesYaml && typeof fixturesYaml === 'object') {
    storeFixtures(fixturesYaml);
  }
};

const loadFiles = async (files) =>
  walk(fromDir, files, {onFixtureFile: loadFile});


const cleanDirectory = (files) =>
  walk(fromDir, files, {onFixtureFile: (file) => {
    console.log('unlink:', file);

    return fs.promises.unlink(file);
  }});

const writeFiles = () => {
  Object.entries(fixtures).map(([key, value]) => {
    const classPath = key.split('\\');
    const indexLast = classPath.length-1;
    const filename = kebabCase(
        classPath[indexLast][0].toLowerCase() +
        classPath[indexLast].slice(1) +
        '.yml',
    );
    const fixturesYaml = yaml.dump({[key]: value});
    // console.log(`Write: ${key} ${filename}\n${Object.keys(value)}`);
    fs.promises.appendFile(path.join(outDir, filename), fixturesYaml);
  });
};

(async () => {
  const files = await fs.promises.readdir( fromDir );

  await loadFiles(files);
  await cleanDirectory(files);

  try {
    await fs.promises.access(outDir, constants.R_OK | constants.W_OK);
  } catch (e) {
    await fs.promises.mkdir(outDir, {recursive: true});
  }

  await writeFiles();
})();
