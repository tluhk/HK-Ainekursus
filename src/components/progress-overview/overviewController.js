import { performance } from 'perf_hooks';

import getAllCoursesData from '../../functions/getAllCoursesData';
import allNotificationsController from '../notifications/notificationsController';
import teamsController from '../teams/teamsController';

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

    const { selectedTeam, courseSlug } = req.params;
    const { selectedCourse } = req.session;
    req.session.selectedCourse = null;

    /* console.log('selectedTeam4:', selectedTeam);
    console.log('courseSlug4:', courseSlug);
    console.log('selectedCourse4:', selectedCourse);

    console.log('req.user44:', req.user); */
    // By default set displayBy to 'teams'
    const displayBy = req.session.displayBy || 'teams';
    res.locals.displayBy = displayBy;
    // console.log('displayBy44:', displayBy);

    if (!displayBy) return res.redirect('/notfound');
    if (displayBy === 'teams') return allOverviewController.getOverviewByTeams(req, res);
    if (displayBy === 'courses') return allOverviewController.getOverviewByCourses(req, res);

    // By default return Teams overview
    return allOverviewController.getOverviewByTeams(req, res);
  },
  getOverviewByTeams: async (req, res) => {
    const { displayBy } = res.locals;
    const { teams } = await teamsController.getAllValidTeams().catch((error) => {
      console.error(error);
      return res.redirect('/notfound');
    });

    if (!teams) return res.redirect('/notfound');
    teams.sort((a, b) => a.slug.localeCompare(b.slug));
    // console.log('teams3:', teams);

    const teamsCourses = {};

    const teamsCoursesPromises = teams.map(async (team) => {
      const coursesData = await getAllCoursesData(team.slug, req);
      teamsCourses[team.slug] = coursesData;
    });

    await Promise.all(teamsCoursesPromises);

    // console.log('teamsCourses3:', teamsCourses);

    /*
    * Get all users in each team
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

    return res.render('overview-teams', {
      user: req.user,
      displayBy,
      teams,
      teamsCourses,
      teamsUsers,
      teachers: teamsUsers.teachers,
    });
  },

  getOverviewByCourses: async (req, res) => {
    console.log();

    return res.render('overview-courses', {
      user: req.user,
    });
  },
};

export default allOverviewController;
