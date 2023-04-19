/* eslint-disable camelcase */
/* eslint-disable max-len */

import axios from 'axios';

import githubTeamsRequests from '../../functions/githubTeamsRequests';
import { authToken } from '../../setup/setupGithub';

const { requestTeams, requestTeamMembers } = githubTeamsRequests;

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  getTeamsService: async () => {
    // console.log('starting to get members');
    const teamsRaw = await axios.get(requestTeams, authToken).catch((error) => {
      console.error(error);
    });
    // console.log('teamsRaw0:', teamsRaw);
    if (!teamsRaw) return [];
    const teams = teamsRaw.data;
    // console.log('teams0:', teams);

    return teams;
  },
  getTeamMembersService: async (teamSlug) => {
    // console.log('starting to get teamMembers');
    const teamMembersRaw = await axios.get(requestTeamMembers(teamSlug), authToken).catch((error) => {
      console.error(error);
    });

    if (!teamMembersRaw) return [];
    // console.log('teamMembersRaw1.data:', teamMembersRaw.data);

    const teamMembersMapped = teamMembersRaw.data.map((member) => member);
    /* (
      {
        login: member.login,
        id: member.id,
        node_id: member.node_id,
        url: member.url,
        type: member.type,
        site_admin: member.site_admin,
        avatar_url: member.avatar_url,
      }) */

    // console.log('teamMembersMapped1:', teamMembersMapped);

    const teamMembers = teamMembersMapped;
    // console.log('teamMembers1:', teamMembers);

    return teamMembers;
  },
};

export default apiRequests;
