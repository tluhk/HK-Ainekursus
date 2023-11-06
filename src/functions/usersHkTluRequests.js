// Github API request endpoints
import dotenv from 'dotenv';

dotenv.config();

const membersRequests = {
  requestMembers: 'users',
  requestGroups: 'groups',
  getUser: 'users/github/'
};

export default membersRequests;
