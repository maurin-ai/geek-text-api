export const INVALID = Symbol('invalid');

export const parseInteger = (raw) => (/^\d{1,9}$/.test(raw) ? Number(raw) : null);
export const parsePrice = (raw) => (/^\d{1,8}(\.\d{1,2})?$/.test(raw) ? Number(raw) : null);
export const parseId = (raw) => {
    const n = parseInteger(raw);
    return n > 0 ? n : null;
};

// Field parsers return the cleaned value or INVALID
export const text = (max = Infinity) => (v) =>
    typeof v === 'string' && v.length <= max ? v.trim() : INVALID;

export const nonEmpty = (parse) => (v) => {
    const result = parse(v);
    return result === INVALID || result === '' ? INVALID : result;
};

export const nullable = (parse) => (v) => (v === null ? null : parse(v));

// Accepts 12.99 or "12.99" like POST /books does
export const number = (min, max, { integer = false } = {}) => (v) => {
    const n = typeof v === 'number' ? v
        : typeof v === 'string' && v.trim() !== '' ? Number(v)
        : NaN;
    if (!Number.isFinite(n) || n < min || n > max) return INVALID;
    if (integer && !Number.isInteger(n)) return INVALID;
    return n;
};

// fields = { body_name: { key: 'modelKey', parse } }
// Returns { error } or { values } keyedo by the model's names
export function parsePatchBody(body, fields) {
    if (body === null || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
        return { error: 'Request body must be a JSON object with at least one field to update' };
    }

    const values = {};
    for (const [name, raw] of Object.entries(body)) {
        if (!Object.hasOwn(fields, name)) {
            return { error: `Unknown or read-only field '${name}'. Allowed: ${Object.keys(fields).join(', ')}` };
        }
        const value = fields[name].parse(raw);
        if (value === INVALID) return { error: `Invalid value for '${name}'` };
        values[fields[name].key] = value;
    }

    return { values };
}