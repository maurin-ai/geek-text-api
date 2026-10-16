import pool from '../config/db.js';
import { findByAuthorId } from './book.model.js';
import { buildSetClause } from '../utils/sql.js';

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

const AUTHOR_COLUMN_MAP = {
    firstName: 'first_name',
    lastName: 'last_name',
    biography: 'biography',
    publisher: 'publisher'
};

export async function findAll() {
    const result = await pool.query(
        `SELECT author_id, first_name, last_name, biography, publisher
        FROM authors
        ORDER BY last_name, first_name`
    );

    return result.rows;
}

export async function findById(authorId) {
    const result = await pool.query(
        `SELECT author_id, first_name, last_name, biography, publisher
        FROM authors
        WHERE author_id = $1`,
        [authorId]
    );

    return result.rows[0];
}

export async function update(authorId, fields) {
    const { sets, params } = buildSetClause(AUTHOR_COLUMN_MAP, fields);
    params.push(authorId);

    const result = await pool.query(
        `UPDATE authors
        SET ${sets}
        WHERE author_id = $${params.length}
        RETURNING *`,
        params
    );

    return result.rows[0];
}

export async function remove(authorId) {
    const result = await pool.query(
        `DELETE FROM authors
        WHERE author_id = $1
        RETURNING author_id, first_name, last_name`,
        [authorId]
    );

    return result.rows[0];
}