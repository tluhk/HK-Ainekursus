import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const auth = process.env.AUTH;

// console.log('auth0:', auth);

// Github API token
const authToken = {
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: auth,
  },
};

export {
  axios,
  authToken,
};
