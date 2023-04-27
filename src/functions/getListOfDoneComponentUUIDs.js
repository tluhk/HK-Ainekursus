/* eslint-disable max-len */

import pool from '../../db';

/** Function to get a list of UUIDs of components that have been markedAsDone by a selected user in a selected course. This data is stored in MariaDB.
 * Parameters are user's githubID and course's slug. E.g. '24424256' and 'HKI6001.HK'.
 */
const getMarkedAsDoneComponents = async (githubID, courseSlug) => {
  // console.log('githubID10:', githubID);
  // console.log('courseSlug10:', courseSlug);
  let res10;
  let keysArray = [];

  // read markedAsDoneComponents value from database
  if (githubID && courseSlug) {
    let conn;
    try {
      conn = await pool.getConnection();
      console.log('Connected to MariaDB 5!');

      res10 = await conn.query('SELECT markedAsDoneComponents FROM users_progress WHERE githubID = ? AND courseCode = ?;', [githubID, courseSlug]);
    } catch (err) {
      console.log('Unable to connect to MariaDB 5');
      console.error(err);
    } finally {
      if (conn) conn.release(); // release to pool
    }
    // console.log('res10:', res10);
    // console.log('typeof res10:', typeof res10);

    // if nothing has been saved to databse yet, return empty array
    if (!res10 || !res10[0]) return keysArray;
    // console.log('typeof res10[0].markedAsDoneComponents:', typeof res10[0].markedAsDoneComponents);

    // if sth had been saved to DB before, but then removed and DB now returns empty object, return empty array
    if (res10[0].markedAsDoneComponents === '{}') {
      return keysArray;
    }

    // console.log('res10[0].markedAsDoneComponents:', res10[0].markedAsDoneComponents);

    // remove the curly braces around DB entry (that's string type)
    const string = res10[0].markedAsDoneComponents.slice(1, -1);

    // convert DB string entry to object
    const obj = {};

    string.split(',').forEach((pair) => {
      const [key, value] = pair.trim().split(':');
      // console.log('key:', key);
      // console.log('value:', value);
      const keyUnqouted = key.slice(1, -1);
      const valueUnquoted = value.slice(1, -1);
      obj[keyUnqouted] = valueUnquoted;
    });
    // console.log('obj:', obj);

    // console.log('Object.keys(obj)', Object.keys(obj));
    // Finally, save keys from object to array and return the array of keys.
    keysArray = Object.keys(obj);
    // console.log('keysArray:', keysArray);
  }

  /** Return an array of component UUIDs that have been marked as done (by selected user in selected course). */
  return keysArray;
};

export default getMarkedAsDoneComponents;
