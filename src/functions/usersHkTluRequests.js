// Github API request endpoints
import dotenv from 'dotenv';

dotenv.config();

const membersRequests = {
  requestMembers: `http://localhost:3333/users`,
  requestGroups: `http://localhost:3333/groups`
};

export default membersRequests;
