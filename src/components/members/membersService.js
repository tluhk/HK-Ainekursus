import axios from "axios";
import githubMembersRequests from "../../functions/githubMembersRequests.js";
import { authToken } from "../../setup/setupGithub.js";

const { requestMembers } = githubMembersRequests;

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  getMembersService: async () => {
    const membersRaw = await axios
      .get(requestMembers, authToken)
      .catch((error) => {
        console.error(error);
      });
    return membersRaw.data;
  },
};

export default apiRequests;
