// Builds col = $1, col2 = $2 from a whitelist map so just resuing already existing fields
export function buildSetClause(columnMap, fields) {
    const sets = [];
    const params = [];

    for (const [key, column] of Object.entries(columnMap)) {
        if (fields[key] !== undefined) {
            params.push(fields[key]);
            sets.push(`${column} = $${params.length}`);
        }
    }

    return { sets: sets.join(', '), params };
}