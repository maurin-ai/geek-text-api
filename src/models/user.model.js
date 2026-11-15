import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { buildSetClause } from '../utils/sql.js';

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

export async function update(username, { password, ...fields }) {
    const columns = password === undefined
        ? fields
        : { ...fields, passwordHash: await bcrypt.hash(password, 10) };

    const { sets, params } = buildSetClause({
        name: 'name',
        homeAddress: 'home_address',
        passwordHash: 'password_hash'
    }, columns);

    params.push(username);

    const result = await pool.query(
        `UPDATE users
        SET ${sets}
        WHERE username = $${params.length}
        RETURNING ${PUBLIC_COLUMNS}`,
        params
    );

    return result.rows[0];
}

export async function createCreditCard(userId, { cardNumber, expirationDate, cardholderName }) {
    const result = await pool.query(
        `INSERT INTO credit_cards (user_id, card_number, expiration_date, cardholder_name)
        VALUES ($1, $2, $3, $4)
        RETURNING credit_card_id`,
        [userId, cardNumber, expirationDate, cardholderName]
    );

    return result.rows[0];
}
