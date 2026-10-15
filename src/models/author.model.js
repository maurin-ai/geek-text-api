import pool from '../config/db.js';
import { findByAuthorId } from './book.model.js';

export { findByAuthorId as findBooks };

export async function create({ firstName, lastName, biography, publisher }) {
    const result = await pool.query(
        `INSERT INTO authors (
            first_name,
            last_name,
            biography,
            publisher
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [firstName, lastName, biography, publisher]
    );

    return result.rows[0];
}