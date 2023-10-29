/* eslint-disable max-len */

import pool from '../../db.js';
import {cacheMarkedAsDoneComponents} from '../setup/setupCache.js';


/** Function to get a list of UUIDs of components that have been markedAsDone by a selected user in a selected course. This data is stored in MariaDB.
 * Parameters are user's githubID and course's slug. E.g. '24424256' and 'HKI6001.HK'.
 */
const getMarkedAsDoneComponents = async (githubID, courseSlug) => {
    let res10;
    let keysArray = [];

    const cacheName = `markedAsDoneComponents+${githubID}+${courseSlug}`;

    /** Check if Cache has markedAsDoneComponents array for given user and for given course.
     * This Cache is flushed whenever user adds or removes a component from given course.
     */
    if (!cacheMarkedAsDoneComponents.has(cacheName)) {
        console.log(`❌❌ markedAsDoneComponents for ${githubID} in ${courseSlug} IS NOT from cache`);

        // read markedAsDoneComponents value from database
        if (githubID && courseSlug) {
            let conn;
            try {
                conn = await pool.getConnection();
                // console.log('Connected to MariaDB 5!');

                res10 = await conn.query('SELECT markedAsDoneComponents FROM users_progress WHERE githubID = ? AND courseCode = ?;', [githubID, courseSlug]);
                // console.log('res10:', res10);
            } catch (err) {
                console.log('Unable to get marked as done components');
                console.error(err);
            } finally {
                if (conn) conn.release(); // release to pool

            }

            // if nothing has been saved to database yet, return empty array
            if (!res10 || !res10[0]) return keysArray;

            // if sth had been saved to DB before, but then removed and DB now returns empty object, return empty array
            if (res10[0].markedAsDoneComponents === '{}') {
                return keysArray;
            }

            // remove the curly braces around DB entry (that's string type)
            const string = res10[0].markedAsDoneComponents.slice(1, -1);

            // convert DB string entry to object
            const obj = {};

            string.split(',').forEach((pair) => {
                const [key, value] = pair.trim().split(':');
                const keyUnqouted = key.slice(1, -1);
                const valueUnquoted = value.slice(1, -1);
                obj[keyUnqouted] = valueUnquoted;
            });

            // Finally, save keys from object to array and return the array of keys.
            keysArray = Object.keys(obj);
        }

        cacheMarkedAsDoneComponents.set(cacheName, keysArray);
    } else {
        console.log(`✅✅ markedAsDoneComponents for ${githubID} in ${courseSlug} FROM CACHE`);
        keysArray = cacheMarkedAsDoneComponents.get(cacheName);
    }

    /** Return an array of component UUIDs that have been marked as done (by selected user in selected course). */
    return keysArray;
};

export default getMarkedAsDoneComponents;
