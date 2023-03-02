/* eslint-disable max-len */
const { apiRequests } = require('./teamsService');

const { cache } = require('../../setup/setupCache');

const getOneTeamMembers = async (team) => {
  let members;
  if (typeof team === 'string') {
    members = await apiRequests.getTeamMembersService(team);
  }
  if (typeof team === 'object') {
    members = await apiRequests.getTeamMembersService(team.slug);
  }
  return members;
};

const teamsController = {

  getAllValidTeams: async () => {
    /**
     * Request all teams of tluhk organisation
     */
    const allTeams = await apiRequests.getTeamsService();
    // console.log('allTeams1:', allTeams);

    /**
     * Set conditions, which Teams are read from tluhk org github account
     * Filter out only main teams:
     * -- those that start with "rif" or "HK_" and do NOT contain a hyphen.
     */

    const teams = allTeams.filter((x) => // x.name === 'rif20-valikpraktika-1' ||
      x.name.startsWith('rif') && !x.name.includes('-'),
      /* || (x.name.startsWith('HK_') && !x.name.includes('-'))) */
    );

    // console.log('teams1:', teams);

    return { teams };
  },
  getAllTeamAssignments: async (teams) => {
    // we'll map the team.slugs to an array of promises where each promise resolves with the team members. We'll then pass the promises to Promise.all, await it and log the result.
    // console.log('teams2:', teams);

    // Map each team.slug to a promise that eventually fulfills with each teams members
    const promises = teams.map(async (team) => {
      const members = await getOneTeamMembers(team.slug);
      return members;
    });

    // Wait for all promises to fulfill first, then log the members
    const allMembersByTeam = await Promise.all(promises);
    // console.log('allMembers1:', allMembersByTeam);

    const teamsWithMembers = teams;
    teamsWithMembers.forEach((team, i) => teamsWithMembers[i].members = allMembersByTeam[i]);
    // console.log('teamsWithMembers1:', teamsWithMembers);

    return teamsWithMembers;
  },
  getUserTeam: async (userIDString, teamAssignments) => {
    const userID = parseInt(userIDString, 10);

    /**
   * This code uses the some method of Array instead of forEach. The some method also loops over all elements, but stops when a true value is returned. The foundMember variable is used to store the return value of find, which is either undefined if nothing is found, or the first found element. If foundMember is truthy, it means the user was found and the loop stops.
   */
    let foundTeam;
    // console.log('teamAssignments1:', teamAssignments);
    teamAssignments.some((team) => {
      // console.log('team1:', team);
      const foundMember = team.members.find((member) => {
        // let userTeam;
        // console.log('id1:', member.id);
        if (member.id === userID) {
          // console.log('user found');
          // console.log('team2:', team);
          foundTeam = team;
          console.log(`userId found from team: ${team.name}`);
          return true;
        }
        return false;
      });
      if (foundMember) {
        // console.log('foundMember1:', foundMember);
        // console.log('foundTeam1:', foundTeam);
        return true;
      }
      // console.log('userId not found from teamAssignments');
    });

    // console.log('foundTeam1:', foundTeam);
    return foundTeam;
  },
  getUsersInTeam: async (team) => {
    const usersPromise = await getOneTeamMembers(team);
    const users = await Promise.all(usersPromise);

    return users;
  },
};

module.exports = { teamsController };
