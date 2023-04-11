import apiRequests from './authService';

const authController = {

  getUsernameLinkedToEmail: async (email) => {
    const username = await apiRequests.getUsernameLinkedToPublicEmail(email);
    return { username };
  },
};

export default authController;
