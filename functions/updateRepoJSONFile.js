/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/newline-after-import */
const fs = require('fs');
const fileName = '../repos.json';
const file = require(fileName);

const updateRepoJSONFile = (name) => {
  file.name = name;
  console.log('name', name);
  console.log('file.name', file.name);

  fs.writeFile(fileName, JSON.stringify(file, null, 2), (err) => {
    if (err) return console.log(err);
    console.log(JSON.stringify(file));
    console.log(`writing to ${fileName}`);

    return true;
  });
};

module.exports = { updateRepoJSONFile };
