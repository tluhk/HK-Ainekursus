import axios from "axios";
import githubTeamsRequests from "../../functions/githubTeamsRequests.js";
import { authToken } from "../../setup/setupGithub.js";

const { requestTeams, requestTeamMembers } = githubTeamsRequests;

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  getTeamsService: async () => {
    const teamsRaw = await axios.get(requestTeams, authToken).catch((error) => {
      console.error(error);
    });
    if (!teamsRaw) return [];
    const teams = teamsRaw.data;

    return teams;
  },
  getTeamMembersService: async (teamSlug) => {
    const teamMembersRaw = await axios
      .get(requestTeamMembers(teamSlug), authToken)
      .catch((error) => {
        console.error(error);
      });

    if (!teamMembersRaw) return [];

    const teamMembersMapped = teamMembersRaw.data.map((member) => member);
    return teamMembersMapped;
  },
};

export default apiRequests;
