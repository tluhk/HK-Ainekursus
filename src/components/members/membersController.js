import { cacheOrgMembers } from "../../setup/setupCache.js";
import apiRequests from "./membersService.js";

const membersController = {
  getOrgMembers: async () => {
    /**
     * Request all members of tluhk organisation
     */
    const cacheName = "orgMembers";
    let members;

    if (!cacheOrgMembers.has(cacheName)) {
      console.log(`❌❌ Org Members IS NOT from cache`);
      members = await apiRequests.getMembersService();

      cacheOrgMembers.set(cacheName, members);
    } else {
      console.log(`✅✅ Org Members FROM CACHE`);
      members = cacheOrgMembers.get(cacheName);
    }
    return { members };
  },
  isUserInOrgMembers: async (user) => {
    /**
     * check if given githubUserID is part of tluhk organisation members
     */
    const { members } = await membersController.getOrgMembers();
    const userInOrgMembers = members.find((x) => x.login === user);

    if (!userInOrgMembers) return false;
    return userInOrgMembers;
  },
};

export default membersController;
