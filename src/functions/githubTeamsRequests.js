const baseUrl = "https://api.github.com";
import dotenv from "dotenv";

dotenv.config();

// Github API request endpoints
const githubTeamsRequests = {
  requestTeams: `${baseUrl}/orgs/${process.env.REPO_ORG_NAME}/teams?per_page=1000`,
  requestTeamMembers: (teamSlug) =>
    `${baseUrl}/orgs/${process.env.REPO_ORG_NAME}/teams/${teamSlug}/members?per_page=1000`,
};

export default githubTeamsRequests;
