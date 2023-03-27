/* eslint-disable max-len */
/* eslint-disable no-script-url */
// https://stackoverflow.com/a/40956931
// CommonJS export Alternative:

const path = require('path');
const moment = require('moment');
const { checkServerIdentity } = require('tls');

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
        // console.log('teacherName2:', teacherName);
        // console.log('teachers2:', teachers);
        const teacherData = teachers.find((x) => x.login === teacherName);
        // console.log('teacherData2:', teacherData);

        let teacher;
        /**
         * Kui config-failis kirjutatud teacherUsername ei vasta ühegi kasutaja login-nimele teachers tiimis, siis kuva "Määramata õppejõud" nime ja neutraalset avatari
         */
        if (!teacherData) {
          teacher = {
            login: 'Määramata',
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
      /**
       * Set behaviours on which cases the Version dropdown option should get a checked mark.
       */
      setDefaultChecked: (branchSlug, refBranch, selectedVersion, branches) => {
        // console.log('branchSlug5:', branchSlug);
        // console.log('refBranch5:', refBranch);
        // console.log('selectedVersion5:', selectedVersion);
        // console.log('branches5:', branches);

        /**
         * For students
         */
        if (selectedVersion && branchSlug === selectedVersion) {
          return 'checked';
        }
        if (!selectedVersion && branchSlug === refBranch) {
          return 'checked';
        }
        if (!selectedVersion && !branches.includes(refBranch) && branchSlug === 'master') {
          return 'checked';
        } return '';
      },
      createPath: (currentPath) => {
        const { courseSlug, contentSlug, componentSlug } = currentPath;

        if (courseSlug && contentSlug && componentSlug) return `/course/${courseSlug}/${contentSlug}/${componentSlug}`;
        if (courseSlug && contentSlug && !componentSlug) return `/course/${courseSlug}/${contentSlug}`;
        if (courseSlug && !contentSlug && !componentSlug) return `/course/${courseSlug}`;
      },
      limit: (arr, limit) => {
        if (!Array.isArray(arr)) { return []; }
        return arr.slice(0, limit);
      },
      timeSince: (date) => {
        const seconds = Math.floor((new Date() - Date.parse(date)) / 1000);
        console.log('moment1:', moment(Date.parse(date)).locale('et').startOf('day'));

        let interval = seconds / 31536000;
        if (interval > 1) {
          const years = Math.floor(interval);
          if (years === 1) return `${years} aasta tagasi`;
          return `${years} aastat tagasi`;
        }

        interval = seconds / 2592000;
        if (interval > 1) {
          const months = Math.floor(interval);
          if (months === 1) return `${months} kuu tagasi`;
          return `${months} kuud tagasi`;
        }

        interval = seconds / 604800;
        if (interval > 1) {
          const weeks = Math.floor(interval);
          if (weeks === 1) return `${weeks} nädal tagasi`;
          return `${weeks} nädalat tagasi`;
        }

        interval = seconds / 86400;
        if (interval > 1) {
          const days = Math.floor(interval);
          if (days === 1) return `${days} päev tagasi`;
          return `${days} päeva tagasi`;
        }

        interval = seconds / 3600;
        if (interval > 1) {
          const hours = Math.floor(interval);
          if (hours === 1) return `${hours} tund tagasi`;
          return `${hours} tundi tagasi`;
        }

        interval = seconds / 60;
        if (interval > 1) {
          const minutes = Math.floor(interval);
          if (minutes === 1) return `${minutes} minut tagasi`;
          return `${minutes} minutit tagasi`;
        }

        Math.floor(interval);
        return 'vähem kui 1 minut tagasi';
      },
    },
  });
};
