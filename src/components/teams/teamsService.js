/* eslint-disable camelcase */
/* eslint-disable max-len */

const { default: axios } = require('axios');

const { requestTeams, requestTeamMembers } = require('../../functions/githubTeamsRequests');
const { cache } = require('../../setup/setupCache');

const { authToken } = require('../../setup/setupGithub');

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  getTeamsService: async () => {
    // console.log('starting to get members');
    const teamsRaw = await axios.get(requestTeams, authToken).catch((error) => {
      console.log(error);
    });
    // console.log('teamsRaw0:', teamsRaw);
    const teams = teamsRaw.data;
    // console.log('teams0:', teams);

    return teams;
  },
  getTeamMembersService: async (teamSlug) => {
    // console.log('starting to get teamMembers');
    const teamMembersRaw = await axios.get(requestTeamMembers(teamSlug), authToken).catch((error) => {
      console.log(error);
    });

    // console.log('teamMembersRaw1.data:', teamMembersRaw.data);

    const teamMembersMapped = teamMembersRaw.data.map((member) => member,
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
    );
    // console.log('teamMembersMapped1:', teamMembersMapped);

    const teamMembers = teamMembersMapped;
    // console.log('teamMembers1:', teamMembers);

    return teamMembers;
  },
};

module.exports = { apiRequests };
