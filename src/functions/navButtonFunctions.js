/* eslint-disable max-len */
/**
 * 
 */
const returnPreviousPage = (currentPath, paths) => {
  // console.log('paths', paths);
  // console.log('currentPath', currentPath);
  const currentIndex = paths.findIndex((object) => object.path === currentPath);
  // console.log('currentIndex', currentIndex);
  if (currentIndex !== 0) {
    return paths[currentIndex - 1].path;
  } return currentPath;
};
const returnNextPage = (currentPath, paths) => {
  const currentIndex = paths.findIndex((object) => object.path === currentPath);
  if (currentIndex !== paths.lenght - 1) {
    return paths[currentIndex + 1].path;
  } return currentPath;
};

// *** BUTTONS – FORWARD/BACK PATH SETTINGS ***
const setSingleCoursePaths = (config) => {
  // For Forward/Back buttons, push all possible paths in one course to an Array:
  const singleCoursePaths = [];
  // *** Comment out config.docs.map() if you don't want to show buttons on Ainekursusest pages ***
  config.docs.map((x) => singleCoursePaths.push({
    path: x.slug,
  }));
  config.lessons.map((x) => {
    // *** Comment out singleCoursePaths.push() if you don't want to show buttons on Lesson pages ***
    singleCoursePaths.push({
      path: x.slug,
    });
    // *** Shows buttons on each Components page (teemalehed ja praktikumid) ***
    x.components.map((y) => singleCoursePaths.push({
      path: `${x.slug}/${y}`,
    }));
    // *** Comment out x.additionalMaterials.map() if you don't want to show buttons on Aine Lisamaterjalid pages ***
    x.additionalMaterials.map((z) => singleCoursePaths.push({
      path: `${x.slug}/${z.slug}`,
    }));
  });
  // *** Comment out config.additionalMaterials.map() if you don't want to show buttons on Aine Lisamaterjalid page ***
  config.additionalMaterials.map((x) => singleCoursePaths.push({
    path: x.slug,
  }));

  return singleCoursePaths;
};

module.exports = { returnPreviousPage, returnNextPage, setSingleCoursePaths };
