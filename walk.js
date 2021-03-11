const fs = require('fs');
const path = require( 'path' );

const walkFile = async (fromPath, {onFixtureFile}) => {
  const stat = await fs.promises.stat( fromPath );

  if (stat.isFile()) {
    if (fromPath.endsWith('.yml')) {
      await onFixtureFile(fromPath);
    }
  } else if ( stat.isDirectory() ) {
    const files = await fs.promises.readdir(fromPath);

    await walk(fromPath, files, {onFixtureFile});
  }
};

const walk = async (fromDir, files, options) => {
  for (const file of files) {
    const fromPath = path.join( fromDir, file );

    await walkFile(fromPath, options);
  }
};

module.exports = {walk};
