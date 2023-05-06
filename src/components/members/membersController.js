import { cacheOrgMembers } from '../../setup/setupCache.js';
import apiRequests from './membersService.js';

const membersController = {

  getOrgMembers: async () => {
    /**
     * Request all members of tluhk organisation
     */
    const cacheName = 'orgMembers';
    let members;

    if (!cacheOrgMembers.has(cacheName)) {
      console.log(`❌❌ Org Members IS NOT from cache`);
      members = await apiRequests.getMembersService();
  
      cacheOrgMembers.set(cacheName, members);
    } else {
      console.log(`✅✅ Org Members FROM CACHE`);
      members = cacheOrgMembers.get(cacheName);
    }
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

export default membersController;
