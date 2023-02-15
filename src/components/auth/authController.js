const { apiRequests } = require('./authService');

const authController = {

  getUsernameLinkedToEmail: async (email) => {
    const username = await apiRequests.getUsernameLinkedToPublicEmail(email);
    return { username };
  },
};

module.exports = { authController };
