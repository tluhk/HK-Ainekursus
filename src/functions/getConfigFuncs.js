/* eslint-disable max-len */
import { jsonrepair } from 'jsonrepair';
import base64 from 'base-64';

import utf8 from 'utf8';
import { axios, authToken } from '../setup/setupGithub';

import cache from '../setup/setupCache';

// Import request functions for Axios
import githubReposRequests from './githubReposRequests';

const { requestConfig } = githubReposRequests;

const getRepoResponse = async (selectedCourse, refBranch) => {
  console.log('selectedCourse2:', selectedCourse);
  console.log('refBranch2:', refBranch);
  let response = '';
  try {
    response = await axios.get(requestConfig(selectedCourse, refBranch), authToken);
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }
  console.log('response2:', response);
  return response;
};

const validateConfig = (configObj, selectedCourse, refBranch) => {
  /** Validate that config includes all expected keys */
  const expectedKeys = ['courseUrl', 'teacherUsername', 'active', 'semester', 'docs', 'teacherUsername', 'lessons', 'concepts', 'practices'];

  const objectKeys = Object.keys(configObj);
  const hasAllKeys = expectedKeys.every((key) => objectKeys.includes(key));

  if (!hasAllKeys) {
    console.error(`Config file of ${selectedCourse}, branch ${refBranch} has one or more expected keys missing.`);
    return {};
  }

  /** Validate that docs, additionalMaterials, lessons, concepts and practices keys have Arrays as values and that each array consists of at least on elem (Arrays are not empty).  */

  if (
    !Array.isArray(configObj.docs) || !configObj.docs.length > 0
    || !Array.isArray(configObj.additionalMaterials) || !configObj.additionalMaterials.length > 0
    || !Array.isArray(configObj.lessons) || !configObj.lessons.length > 0
    || !Array.isArray(configObj.concepts) || !configObj.concepts.length > 0
    || !Array.isArray(configObj.practices) || !configObj.practices.length > 0
  ) {
    console.log(`Config file of ${selectedCourse}, branch ${refBranch} has one or more expected keys with incorrect type or empty array.`);
    return {};
  }

  const expectedKeys2 = ['slug', 'name'];
  const objectKeysDocs = Object.keys(configObj.docs[0]);
  const hasAllKeysDocs = expectedKeys2.every((key) => objectKeysDocs.includes(key));

  const objectKeysAdditionalMaterials = Object.keys(configObj.additionalMaterials[0]);
  const hasAllKeysAdditionalMaterials = expectedKeys2.every((key) => objectKeysAdditionalMaterials.includes(key));

  const expectedKeys3 = ['slug', 'name', 'uuid', 'components', 'additionalMaterials'];

  const hasAllKeysLessons = configObj.lessons.every((lesson) => {
    const objectKeysLesson = Object.keys(lesson);
    const lessonHasAllKeys = expectedKeys3.every((key) => objectKeysLesson.includes(key));
    if (!lessonHasAllKeys) {
      console.log(`Config file of ${selectedCourse}, branch ${refBranch} has one or more expected lesson keys missing.`);
      return false;
    }
    if (!Array.isArray(lesson.components)
      || !lesson.components.length > 0
      || !Array.isArray(lesson.additionalMaterials)
      || !lesson.additionalMaterials.length > 0) {
      console.log(`Config file of ${selectedCourse}, branch ${refBranch} has one or more expected lesson keys with incorrect type, or empty array.`);
      return false;
    }
    const lessonKeysAdditionalMaterials = Object.keys(lesson.additionalMaterials[0]);

    console.log('lessonKeysAdditionalMaterials1:', lessonKeysAdditionalMaterials);
    const lessonAddMaterialsHaveKeys = expectedKeys2.every((key) => lessonKeysAdditionalMaterials.includes(key));
    if (!lessonAddMaterialsHaveKeys) {
      console.log(`Config file of ${selectedCourse}, branch ${refBranch} has one or more expected lesson additionalMaterials array with missing keys.`);
      return false;
    }
    return true;
  });

  const expectedKeys4 = ['slug', 'name', 'uuid'];

  const hasAllKeysConcepts = configObj.concepts.every((concept) => {
    const objectKeysConcept = Object.keys(concept);
    return expectedKeys4.every((key) => objectKeysConcept.includes(key));
  });

  const hasAllKeysPractices = configObj.practices.every((practice) => {
    const objectKeysPractice = Object.keys(practice);
    return expectedKeys4.every((key) => objectKeysPractice.includes(key));
  });

  if (!hasAllKeysDocs
    || !hasAllKeysAdditionalMaterials
    || !hasAllKeysLessons
    || !hasAllKeysConcepts
    || !hasAllKeysPractices
  ) {
    console.log(`Config file of ${selectedCourse}, branch ${refBranch} has one or more expected docs, additionalMaterials, lessons, concepts or practices array with missing keys or incorrect type.`);
    return false;
  }
  return true;
};

const getConfig = async (selectedCourse, refBranch) => {
  let config;

  /**
 * Check if cache already has course branch config.
 * If yes, read config from cache.
 * If not, make new github request for config and cache it.
 */
  console.log('selectedCourse1:', selectedCourse);
  console.log('refBranch1:', refBranch);

  const routePath = `getConfig:${selectedCourse}+${refBranch}`;
  // console.log('routePath1:', routePath);
  // console.log('cache.get(routePath)1:', cache.get(routePath));
  console.log('cache.has(routePath)1:', cache.has(routePath));
  console.log('cache.get(routePath)1:', cache.get(routePath));

  if (cache.has(routePath) || cache.get(routePath) !== undefined) {
    config = cache.get(routePath);
    console.log(`✅ getConfig FROM CACHE: ${selectedCourse}+${refBranch}`);
  } else {
    console.log(`❌ getConfig IS NOT from cache: ${selectedCourse}+${refBranch}`);
    try {
      config = await getRepoResponse(selectedCourse, refBranch);
    } catch (error) {
      console.error(error);
    }
    cache.set(routePath, config);
    // console.log('config from api');
  }

  console.log('config2:', config);
  console.log('config.data2:', config.data);

  if (!config.data) return null;
  // console.log('config2:', config);
  /** Decode Github response with base64 and utf8. Result is a string configDecodedUtf8 that contains the config file content. */
  const configDecoded = base64.decode(config.data.content);
  const configDecodedUtf8 = utf8.decode(configDecoded);
  console.log('configDecodedUtf8:', configDecodedUtf8);
  // console.log('typeof configDecodedUtf8:', typeof configDecodedUtf8);

  /** Fix broken JSON before parsing it: https://www.npmjs.com/package/jsonrepair .
   * E.g. the config file might be missing a comma, or double quotes here or there.
   * This must be fixed before JSON.parse() command.
  */
  const repairedConfigJSON = jsonrepair(configDecodedUtf8);
  console.log('repairedConfigJSON8:', repairedConfigJSON);
  console.log('typeof repairedConfigJSON8:', typeof repairedConfigJSON);

  /** Parse string into object */
  const configObj = JSON.parse(repairedConfigJSON);
  console.log('configObj8:', configObj);
  console.log('configObj.lessons[0].additionalMaterials8:', configObj.lessons[0].additionalMaterials);

  if (!validateConfig(configObj, selectedCourse, refBranch)) return {};

  return configObj;
};

export default getConfig;
