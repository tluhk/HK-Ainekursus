/* eslint-disable max-len */
/* eslint-disable no-script-url */
// https://stackoverflow.com/a/40956931
// CommonJS export Alternative:

const path = require('path');

// Siin saab defineerida handlebarsiga seotud detaile.
// Helpers objekti alla saab lisada funktsioone, mida kasutada lisaks built-in helpersitele

// handlebar options: https://stackoverflow.com/a/40898191
module.exports = function hbsHelpers(hbs) {
  return hbs.create({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '../..', '/views/layouts'),
    partialsDir: path.join(__dirname, '../..', '/views/partials'),
    helpers: {
      if_equal: (a, b, opts) => {
        if (a === b) {
          return opts.fn(this);
        } return opts.inverse(this);
      },
      if_not_equal: (a, b, opts) => {
        if (a !== b) {
          return opts.fn(this);
        } return opts.inverse(this);
      },
      SafeStringFiles: (param) => (`javascript:fileFunc(${param});`),

      last: (array) => array[array.length - 1].path,

      concatActivePath: (arg1, arg2) => `${arg1}/${arg2}`,
      ifIn: (elem, list, options) => {
        if (list === undefined) return options.inverse(this);
        const listMap = list.map((a) => a.path);
        if (listMap.indexOf(elem) > -1) {
          return options.fn(this);
        }
        return options.inverse(this);
      },
      ifNotIn: (elem, list, options) => {
        if (list.indexOf(elem) <= -1) {
          return options.fn(this);
        }
        return options.inverse(this);
      },
      componentIcon: (type) => {
        switch (type) {
          case 'docs': return 'attach_file';
          case 'concepts': return 'sticky_note_2';
          case 'practice': return 'home_repair_service';
          default: return '';
            // do nothing
        }
      },
      showComponentType: (component, concepts, practices) => {
        /* console.log('component:', component);
        console.log('concepts:', concepts);
        console.log('practices:', practices); */

        // https://stackoverflow.com/a/50909930
        const checkMatch = (obj) => obj.slug === component;
        if (concepts.some(checkMatch)) return 'sticky_note_2';
        if (practices.some(checkMatch)) return 'build';
        return 'attach_file';
      },
      showComponentName: (componentUppercase, concepts, practices) => {
        const component = componentUppercase;
        const components = concepts.concat(practices);
        const comp = components.find((x) => (x.slug) === component);
        return comp.name;
      },
      capitalize: (aString) => aString.charAt(0).toUpperCase() + aString.slice(1),
      findTeacher: (teacherName, teachers) => {
        // console.log('teacherName1:', teacherName);
        // console.log('teachers2:', teachers);
        const teacherData = teachers.find((x) => x.login === teacherName);
        let teacher;
        /**
         * Kui config-failis kirjutatud teacherUsername ei vasta ühegi kasutaja login-nimele teachers tiimis, siis kuva "Määramata õppejõud" nime ja neutraalset avatari
         */
        if (!teacherData) {
          teacher = {
            login: 'Määramata õppejõud',
            avatar_url: '/images/anonymous-avatar.png',
          };
        } else {
          teacher = {
            login: teacherData.login,
            avatar_url: teacherData.avatar_url,
          };
        }
        // console.log('teacher1:', teacher);
        return teacher;
      },
    },
    /*
    {{#showComponentType this ../../concepts ../../practices}}
                  {{/showComponentType }}
    */
  /* ifIn: (elem, objects) => {
        console.log('objects', objects);
        const index = objects.findIndex((object) => object.path === elem);
        if (index > -1) {
          return true;
        }
        return false;
      }, */
  });
};
