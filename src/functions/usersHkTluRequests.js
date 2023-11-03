// Github API request endpoints
import dotenv from 'dotenv';

dotenv.config();

const membersRequests = {
  requestMembers: `${ process.env.USERS_API_URL }users`,
  requestGroups: `${ process.env.USERS_API_URL }groups`
};

export default membersRequests;
