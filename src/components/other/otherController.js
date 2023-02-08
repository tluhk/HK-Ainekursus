const otherController = {
  /**
   * for unknown routes
   */
  notFound: ((req, res) => res.render('notfound', {
    user: req.user,
  })),
  /**
   * for not authorized not login (github user not part of tluhk organisation)
   */
  noAuth: ((req, res) => res.render('noauth', {
  })),
};

module.exports = { otherController };
