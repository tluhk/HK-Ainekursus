const { apiRequests } = require('./membersService');

const membersController = {

  getOrgMembers: async () => {
    /**
     * Request all members of tluhk organisation
     */
    const members = await apiRequests.getMembersService();
    // console.log('allMembers1:', members);
    return { members };
  },
  isUserInOrgMembers: async (githubUserIDString) => {
    /**
     * check if given githubUserID is part of tluhk organisation members
     */
    const { members } = await membersController.getOrgMembers();
    const githubUserID = parseInt(githubUserIDString, 10);
    const userInOrgMembers = members.find((x) => x.id === githubUserID);

    if (!userInOrgMembers) return false;
    return userInOrgMembers;
  },
};

module.exports = { membersController };
