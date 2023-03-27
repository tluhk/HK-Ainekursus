const { getAllCoursesData } = require("../../functions/getAllCoursesData");
const { apiRequestsCommits } = require("../commits/commitsService");
const { teamsController } = require("../teams/teamsController");

/* eslint-disable max-len */
const allNotificationsController = {
  getCoursesUpdates: async (allCoursesActive) => {
    const commentsWithCourses = await Promise.all(allCoursesActive.map(async (activeCourse) => {
      const commitsRaw = await apiRequestsCommits.commitsService(activeCourse.coursePathInGithub, activeCourse.refBranch);
      const commitsWithComments = commitsRaw.data.filter((commit) => commit.commit.comment_count > 0);
      // console.log('commitsWithComments2:', commitsWithComments);

      const commitSHAsWithComments = commitsWithComments.map((commit) => commit.sha);
      // console.log('commitSHAsWithComments2:', commitSHAsWithComments);

      const commitCommentsPromises = commitSHAsWithComments.map((commitSHA) => apiRequestsCommits.getCommitComments(activeCourse.coursePathInGithub, commitSHA));
      const commitCommentsRaw = await Promise.all(commitCommentsPromises);
      // console.log('commitCommentsRaw2:', commitCommentsRaw);

      const commentsArray = commitCommentsRaw.flatMap((item) => item.data.map((comment) => ({
        url: comment.url,
        html_url: comment.html_url,
        id: comment.id,
        node_id: comment.node_id,
        user: comment.user,
        position: comment.position,
        line: comment.line,
        path: comment.path,
        commit_id: comment.commit_id,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author_association: comment.author_association,
        body: comment.body,
        reactions: comment.reactions,
      })));
      // console.log('commentsArray2:', commentsArray);

      commentsArray.forEach((comment) => {
        comment.course = activeCourse;
      });

      return commentsArray;
    }));

    // console.log('commentsWithCourses1:', commentsWithCourses);

    const commentsWithCoursesFlattened = commentsWithCourses.flatMap((arr) => arr);
    // eslint-disable-next-line no-nested-ternary
    commentsWithCoursesFlattened.sort((b, a) => ((a.created_at > b.created_at) ? 1 : ((b.created_at > a.created_at) ? -1 : 0)));

    // console.log('commentsWithCoursesFlattened1:', commentsWithCoursesFlattened);

    /**
     * Limit notifications to max 30 days ago
     */
    const date30DaysAgo = new Date();
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
    const dateISO30DaysAgo = date30DaysAgo.toISOString().substring(0, 10);

    // console.log('dateISO30DaysAgo1:', dateISO30DaysAgo);

    const courseUpdatesLessThan30Days = commentsWithCoursesFlattened.filter((entry) => entry.created_at >= dateISO30DaysAgo);

    return courseUpdatesLessThan30Days;
  },
  renderNotificationsPage: async (req, res) => {
    let { allCoursesActive, allTeachers } = res.locals;
    // console.log('allCoursesActive3:', allCoursesActive);
    // console.log('allTeachers3:', allTeachers);

    if (!allCoursesActive) {
      let teamSlug;
      if (req.user && req.user.team) teamSlug = req.user.team.slug;
      /**
       * Check if teamSlug is 'teachers'
       * If yes, then get teacher courses info
       * If not, then get user courses info
       */
      let isTeacher = false;
      if (teamSlug === 'teachers') isTeacher = true;
      res.locals.teamSlug = teamSlug;

      const start3 = performance.now();
      const allCourses = await getAllCoursesData(teamSlug);
      const end3 = performance.now();
      console.log(`Execution time getAllCoursesData: ${end3 - start3} ms`);
      // console.log('allCourses1:', allCourses);
      allCoursesActive = allCourses.filter((x) => x.courseIsActive);
      // console.log('allCoursesActive1:', allCoursesActive);
    }

    /** Save all teachers in a variable, needed for rendering */
    if (!allTeachers) {
      const start4 = performance.now();
      allTeachers = await teamsController.getUsersInTeam('teachers');
      const end4 = performance.now();
      console.log(`Execution time allTeachers: ${end4 - start4} ms`);
    }

    /**
     * Get notifications
     */
    const courseUpdates = await allNotificationsController.getCoursesUpdates(allCoursesActive);
    // console.log('courseUpdates4:', courseUpdates);

    return res.render('notifications-student', {
      courses: allCoursesActive,
      user: req.user,
      teachers: allTeachers,
      courseUpdates,
    });
  },
};

module.exports = {
  allNotificationsController,
};
