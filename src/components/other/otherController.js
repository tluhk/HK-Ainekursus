const otherController = {
  /**
   * for unknown routes
   */
  notFound: ((req, res) => res.render('notfound', {
  })),
};

module.exports = { otherController };
