import pool from '../config/db.js';

const PUBLIC_COLUMNS = `
    user_id,
    username,
    name,
    email_address,
    home_address`;

export async function findByUsername(username) {
    const result = await pool.query(
        `SELECT ${PUBLIC_COLUMNS}
        FROM users
        WHERE username = $1`,
        [username]
    );

    return result.rows[0];
}