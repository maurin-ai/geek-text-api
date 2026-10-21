import bcrypt from 'bcrypt';
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

export async function create({ username, password, name, emailAddress, homeAddress }) {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users (username, password_hash, name, email_address, home_address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING ${PUBLIC_COLUMNS}`,
        [username, passwordHash, name, emailAddress, homeAddress]
    );

    return result.rows[0];
}
