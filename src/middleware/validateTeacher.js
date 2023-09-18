/** Function to validate if logged-in user is a teacher or not.
 */
const validateTeacher = (req, res, next) => {
  if (req.user.team.slug === "teachers") {
    // console.log('req.session1:', req.session);
    // console.log('req.session.passport.user.id1:', req.session.passport.user.id);
    // console.log('Authenticated');
    return next();
  }
  // console.log('req.session2:', req.session);
  console.log(
    "Page is available only for teachers. User is NOT in 'teachers' team. Rerouting to /notfound page.",
  );
  return res.redirect("/notfound");
};

export default validateTeacher;
