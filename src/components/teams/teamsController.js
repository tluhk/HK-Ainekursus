/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable max-len */
import pool from '../../../db';

import apiRequests from './teamsService';

import cache from '../../setup/setupCache';

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
      (x.slug.startsWith('rif') && !x.slug.includes('-'))
      || (x.slug.startsWith('teachers') && !x.slug.includes('-')),
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
      const members = await teamsController.getOneTeamMembers(team.slug);
      return members;
    });

    // Wait for all promises to fulfill first, then log the members
    const allMembersByTeam = await Promise.all(promises);
    // console.log('allMembers1:', allMembersByTeam);

    const teamsWithMembers = teams;
    // eslint-disable-next-line no-return-assign
    teamsWithMembers.forEach((team, i) => teamsWithMembers[i].members = allMembersByTeam[i]);
    // console.log('teamsWithMembers1:', teamsWithMembers);

    return teamsWithMembers;
  },
  getUserTeam: async (userIDString, teamAssignments) => {
    const userID = parseInt(userIDString, 10);

    // console.log('teamAssignments1:', teamAssignments);
    /**
   * This code uses the some method of Array instead of forEach. The some method also loops over all elements, but stops when a true value is returned. The foundMember variable is used to store the return value of find, which is either undefined if nothing is found, or the first found element. If foundMember is truthy, it means the user was found and the loop stops.
   */
    let foundTeam;
    let foundMember;
    /**
     * Check if user in teachers team
     */
    const teachers = teamAssignments.find(({ slug }) => slug === 'teachers');
    foundMember = teachers.members.find((member) => {
      // let userTeam;
      // console.log('id1:', member.id);
      if (member.id === userID) {
        // console.log('user found');
        // console.log('team2:', team);
        foundTeam = teachers;
        console.log(`userId found from team: ${teachers.slug}`);
        return true;
      }
      return false;
    });
    // console.log('userId not found from teamAssignments');
    /**
     * If not in teacher team, check which other team they're in.
     * Get only first team they're found from, don't allow multiple teams.
     */
    // console.log('teamAssignments1:', teamAssignments);
    if (!foundTeam) {
      teamAssignments.some((team) => {
        // console.log('team1:', team);

        if (team.slug === 'teachers') return false;
        foundMember = team.members.find((member) => {
        // let userTeam;
        // console.log('id1:', member.id);
          if (member.id === userID) {
          // console.log('user found');
          // console.log('team2:', team);
            foundTeam = team;
            console.log(`userId found from team: ${team.slug}`);
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
    }

    // console.log('foundTeam1:', foundTeam);
    return foundTeam;
  },
  getUsersInTeam: async (team) => {
    let users;
    const routePath = `usersInTeam+${team}`;

    if (!cache.has(routePath)) {
      console.log(`❌❌ users in team IS NOT from cache: ${routePath}`);
      const usersPromise = await teamsController.getOneTeamMembers(team);
      users = await Promise.all(usersPromise);

      // console.log('users2:', users);

      let conn;

      const promises = users.map(async (user, index) => {
        let response;
        try {
          conn = await pool.getConnection();
          response = await conn.query('SELECT username, displayName, email FROM users WHERE githubID = ?;', [user.id]);
          // console.log('response3:', response);
          // console.log('users[index]3:', users[index]);
        } catch (err) {
          console.log('getUsersInTeam error:');
          console.error(err);
        } finally {
          if (conn) conn.release(); // release to pool
        }

        // console.log('response4:', response);
        let displayName;
        let email;
        if (response && response[0]) {
          displayName = response[0].displayName;
          email = response[0].email;
        }

        // console.log('displayName3:', displayName);
        // console.log('email3:', email);

        if (!users[index].displayName && displayName) {
          users[index].displayName = displayName;
        } else users[index].displayName = users[index].login;

        users[index].email = email;
        // console.log('users5:', users);
      });

      await Promise.all(promises);
      // console.log('users4:', users);

      cache.set(routePath, users);
    } else {
      console.log(`✅✅ users in team FROM CACHE: ${routePath}`);
      users = cache.get(routePath);
    }

    // console.log('users3:', users);
    return users;
  },
  getOneTeamMembers: async (team) => {
    let members;
    if (typeof team === 'string') {
      members = await apiRequests.getTeamMembersService(team);
    }
    if (typeof team === 'object') {
      members = await apiRequests.getTeamMembersService(team.slug);
    }
    return members;
  },
};

export default teamsController;
