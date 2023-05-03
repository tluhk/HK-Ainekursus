import { performance } from 'perf_hooks';

import getAllCoursesData from '../../functions/getAllCoursesData.js';
import getMarkedAsDoneComponents from '../../functions/getListOfDoneComponentUUIDs.js';
import teamsController from '../teams/teamsController.js';

/* eslint-disable max-len */
const allOverviewController = {
  getOverview: async (req, res) => {
    /**
     * Check if user's team is 'teachers'
     * If not, then reroute to "/notfound" page
     * If yes, then continue to get overview info
     */
    let teamSlug;
    if (req.user && req.user.team) teamSlug = req.user.team.slug;
    if (teamSlug !== 'teachers') return res.redirect('/notfound');

    const { team, courseSlug } = req.params;
    let { courseSlugData } = req.session;

    /**
    * Check if team, courseSlug params and courseSlugData from req.session are provided
    * If team, courseSlug params and courseSlugData from req.session ARE NOT provided, then user is requesting to load /progress-overview page to see all team/course options. Then you will check if displayBy is provided with req.session. And then render /progress-overview.
    */

    // By default set displayBy to 'teams'
    const displayBy = req.session.displayBy || 'teams';
    res.locals.displayBy = displayBy;

    // console.log('displayBy4:', displayBy);
    // console.log('team4:', team);
    // console.log('courseSlug4:', courseSlug);
    // console.log('courseSlugData4:', courseSlugData);
    // console.log('req.user44:', req.user);

    if (displayBy && team && !courseSlug) {
      return res.redirect('/progress-overview');
    }
    if (displayBy === 'teams' && !team && !courseSlug) return allOverviewController.getOverviewByTeams(req, res);
    if (displayBy === 'courses' && !team && !courseSlug) return allOverviewController.getOverviewByCourses(req, res);

    /*
    * If team, courseSlug ARE provided, but courseSlugData from req.session IS NOT, then user approached directly from URL, without sending req.session data. Then get courseSlugData separately.
    * Once courseSlugData is provided, then continue to render team-course overview page /progress-overview/:team/:courseSlug.
    */
    if (team && courseSlug) {
      if (!courseSlugData || courseSlugData === '') {
        const teamCoursesPromises = await getAllCoursesData(team, req);
        await Promise.all(teamCoursesPromises);
        // console.log('teamCoursesPromises4:', teamCoursesPromises);
        const courseSlugDataRequested = teamCoursesPromises.find((course) => course.courseSlug === courseSlug);
        /* If courseSlugDataRequested is not found, then user accessed /('/progress-overview/:team/:courseSlug with invalid team or courseSlug params. Route back to 7progress-overview page.
        * Else save courseSlugDataRequested to courseSlugData and load /progress-overview/:team/:courseSlug page.
        */
        // console.log('courseSlugDataRequested4:', courseSlugDataRequested);
        if (!courseSlugDataRequested) return res.redirect('/progress-overview');
        courseSlugData = courseSlugDataRequested;
      }
    }
    res.locals = { team, courseSlug, courseSlugData };
    // console.log('courseSlugData4:', courseSlugData);

    return allOverviewController.showProgress(req, res);
  },
  getOverviewByTeams: async (req, res) => {
    const { displayBy } = res.locals;
    const { teams } = await teamsController.getAllValidTeams().catch((error) => {
      console.error(error);
      return res.redirect('/notfound');
    });

    if (!teams) return res.redirect('/notfound');

    /** Remove teachers team from teams array. Teachers team's courses shouldn't be displayed on app.
     * However you still need to keep teams array with teachers to get teachers names for rendering.
    */

    const teamsExclTeachers = teams.filter((team) => team.slug !== 'teachers');
    teamsExclTeachers.sort((a, b) => a.slug.localeCompare(b.slug));

    const teamsCourses = {};

    const teamsCoursesPromises = teamsExclTeachers.map(async (team) => {
      const coursesData = await getAllCoursesData(team.slug, req);
      teamsCourses[team.slug] = coursesData;
    });

    await Promise.all(teamsCoursesPromises);

    // console.log('teamsCourses3:', teamsCourses);

    const teamsCoursesSorted = Object.keys(teamsCourses)
      .sort()
      .reduce((acc, team) => {
        // console.log('team3:', team);
        // console.log('teamsCourses[team]3:', teamsCourses[team]);
        if (teamsCourses[team].length > 0) acc[team] = teamsCourses[team].sort((a, b) => a.courseName.localeCompare(b.courseName));
        return acc;
      }, {});

    /*
    * Get all users in each team
    * Use teams array where teachers team is included.
    * Save all teachers in a variable, needed for rendering
    */
    const teamsUsers = {};
    const start4 = performance.now();
    const teamsUsersPromises = teams.map(async (team) => {
      const usersData = await teamsController.getUsersInTeam(team.slug);
      teamsUsers[team.slug] = usersData;
    });

    await Promise.all(teamsUsersPromises);
    const end4 = performance.now();
    console.log(`Execution time teamsUsers: ${end4 - start4} ms`);

    // console.log('teamsUsers3:', teamsUsers);

    const teamsUsersSorted = Object.keys(teamsUsers)
      .sort()
      .reduce((acc, team) => {
        acc[team] = teamsUsers[team].sort((a, b) => a.displayName.localeCompare(b.displayName));
        return acc;
      }, {});

    return res.render('overview-teams', {
      user: req.user,
      displayBy,
      teams: teamsExclTeachers,
      teamsCourses: teamsCoursesSorted,
      teamsUsers: teamsUsersSorted,
      teachers: teamsUsersSorted.teachers,
    });
  },

  getOverviewByCourses: async (req, res) => {
    const { displayBy } = res.locals;
    const { teams } = await teamsController.getAllValidTeams().catch((error) => {
      console.error(error);
      return res.redirect('/notfound');
    });

    if (!teams) return res.redirect('/notfound');

    /** Remove teachers team from teams array. Teachers team's courses shouldn't be displayed on app.
     * However you still need to keep teams array with teachers to get teachers names for rendering.
     */
    const teamsExclTeachers = teams.filter((team) => team.slug !== 'teachers');
    teamsExclTeachers.sort((a, b) => a.slug.localeCompare(b.slug));
    // console.log('teams3:', teams);

    const teamsCourses = {};

    const teamsCoursesPromises = teamsExclTeachers.map(async (team) => {
      const coursesData = await getAllCoursesData(team.slug, req);
      teamsCourses[team.slug] = coursesData;
    });

    await Promise.all(teamsCoursesPromises);
    const teamsCoursesSorted = Object.keys(teamsCourses)
      .sort()
      .reduce((acc, team) => {
        acc[team] = teamsCourses[team].sort((a, b) => a.courseName.localeCompare(b.courseName));
        return acc;
      }, {});

    console.log('teamsCoursesSorted3:', teamsCoursesSorted);

    const coursesWithTeams = [];

    Object.keys(teamsCoursesSorted).forEach((team) => {
      teamsCoursesSorted[team].forEach((course) => {
        const existingCourse = coursesWithTeams.find((c) => c.courseUrl === course.courseUrl);
        if (existingCourse) {
          existingCourse.courseConfigByTeam[team] = course;
        } else {
          coursesWithTeams.push({
            courseUrl: course.courseUrl,
            courseName: course.courseName,
            courseCode: course.courseCode,
            courseSlug: course.courseSlug,
            courseConfigByTeam: {[team]: course},
          });
        }
      });
    });

    coursesWithTeams.sort((a, b) => a.courseName.localeCompare(b.courseName));

    console.log(coursesWithTeams);
    console.log('coursesWithTeams3:', coursesWithTeams);

    /* Get all users in each team.
    * Use teams array where teachers team is included.
    * Save all teachers in a variable, needed for rendering
    */
    const teamsUsers = {};
    const start4 = performance.now();
    const teamsUsersPromises = teams.map(async (team) => {
      const usersData = await teamsController.getUsersInTeam(team.slug);
      teamsUsers[team.slug] = usersData;
    });

    await Promise.all(teamsUsersPromises);
    const end4 = performance.now();
    console.log(`Execution time teamsUsers: ${end4 - start4} ms`);

    const teamsUsersSorted = Object.keys(teamsUsers)
      .sort()
      .reduce((acc, team) => {
        acc[team] = teamsUsers[team].sort((a, b) => a.displayName.localeCompare(b.displayName));
        return acc;
      }, {});
    // console.log('teamsUsersSorted3:', teamsUsersSorted);

    return res.render('overview-courses', {
      user: req.user,
      displayBy,
      teams: teamsExclTeachers,
      coursesWithTeams,
      teamsUsers: teamsUsersSorted,
      teachers: teamsUsersSorted.teachers,
    });
  },
  showProgress: async (req, res) => {
    const { team, courseSlug, courseSlugData } = res.locals;
    // console.log('team5:', team);
    // console.log('courseSlug5:', courseSlug);
    console.log('courseSlugData5:', courseSlugData);

    const usersInTeam = await teamsController.getUsersInTeam(team);
    const usersInTeachersTeam = await teamsController.getUsersInTeam('teachers');

    const usersInTeamAndNotInTeachers = usersInTeam.filter((user) => !usersInTeachersTeam.some((user2) => user.login === user2.login));
    const usersGithubIDsArray = usersInTeamAndNotInTeachers.map((user) => `${user.id}`);

    // console.log('usersInTeam5:', usersInTeam);
    // console.log('usersInTeachersTeam5:', usersInTeachersTeam);
    // console.log('usersInTeamAndNotTeachers5:', usersInTeamAndNotInTeachers);
    // console.log('usersGithubIDsArray5:', usersGithubIDsArray);

    let usersDataPromises;
    if (courseSlug && usersGithubIDsArray.length > 0) {
      usersDataPromises = usersInTeamAndNotInTeachers.map(async (user, index) => {
        // Connects to DB again for each user
        const markedAsDoneComponents = await getMarkedAsDoneComponents(user.id, courseSlug);
        // console.log('user.login5:', user.login);
        // console.log('markedAsDoneComponents5:', markedAsDoneComponents);
        // console.log('usersInTeamAndNotInTeachers[index]5:', usersInTeamAndNotInTeachers[index]);
        usersInTeamAndNotInTeachers[index].markedAsDoneComponents = markedAsDoneComponents;
        // console.log('usersInTeamAndNotInTeachers[index]55:', usersInTeamAndNotInTeachers[index]);
        // usersData.push(usersInTeamAndNotInTeachers[index]);
        return usersInTeamAndNotInTeachers[index];
      });
    }

    let usersData;
    if (usersDataPromises && usersDataPromises[0]) usersData = await Promise.all(usersDataPromises);

    /* Sort users by displayName */
    usersData.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // console.log('usersData2:', usersData);
    // console.log('courseSlugData2:', courseSlugData);
    // console.log('usersInTeachersTeam2:', usersInTeachersTeam);

    return res.render('overview-stats', {
      user: req.user,
      courseData: courseSlugData,
      team,
      usersData,
      teachers: usersInTeachersTeam
    });
  },
};

export default allOverviewController;
