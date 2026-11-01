import * as User from '../models/user.model.js';

export async function getByUsername(req, res) {
    const { username } = req.params;

    try {
        const user = await User.findByUsername(username);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json(user);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Server error'
        });
    }
}

export async function createUser(req, res) {
    const { username, password, name, emailAddress, homeAddress } = req.body || {};

    const trimmedUsername = typeof username === 'string' ? username.trim() : '';

    if (!trimmedUsername || typeof password !== 'string' || password === '') {
        return res.status(400).json({
            error: 'username and password are required'
        });
    }

    if (trimmedUsername.length > 100) {
        return res.status(400).json({
            error: 'username must be at most 100 characters'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            error: 'password must be at least 8 characters'
        });
    }

    if (
        (name !== undefined && name !== null && typeof name !== 'string') ||
        (emailAddress !== undefined && emailAddress !== null && typeof emailAddress !== 'string') ||
        (homeAddress !== undefined && homeAddress !== null && typeof homeAddress !== 'string')
    ) {
        return res.status(400).json({
            error: 'name, emailAddress and homeAddress must be strings'
        });
    }

    const trimmedName = typeof name === 'string' && name.trim() !== ''
        ? name.trim()
        : null;

    const trimmedEmailAddress = typeof emailAddress === 'string' && emailAddress.trim() !== ''
        ? emailAddress.trim()
        : null;

    const trimmedHomeAddress = typeof homeAddress === 'string' && homeAddress.trim() !== ''
        ? homeAddress.trim()
        : null;

    if (trimmedName && trimmedName.length > 255) {
        return res.status(400).json({
            error: 'name must be at most 255 characters'
        });
    }

    if (trimmedEmailAddress) {
        if (trimmedEmailAddress.length > 255) {
            return res.status(400).json({
                error: 'emailAddress must be at most 255 characters'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmailAddress)) {
            return res.status(400).json({
                error: 'emailAddress must be a valid email address'
            });
        }
    }

    try {
        const existingUser = await User.findByUsername(trimmedUsername);

        if (existingUser) {
            return res.status(409).json({
                error: 'Username is already taken'
            });
        }

        await User.create({
            username: trimmedUsername,
            password,
            name: trimmedName,
            emailAddress: trimmedEmailAddress,
            homeAddress: trimmedHomeAddress
        });

        res.status(201).end();

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to create user'
        });
    }
}

export async function updateUser(req, res) {
    const { username } = req.params;
    const body = req.body;

    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({
            error: 'Request body must be a JSON object'
        });
    }

    if (
        Object.hasOwn(body, 'emailAddress') ||
        Object.hasOwn(body, 'email_address') ||
        Object.hasOwn(body, 'email')
    ) {
        return res.status(400).json({
            error: 'emailAddress cannot be updated'
        });
    }

    const { name, homeAddress, password, ...unknownFields } = body;

    if (Object.keys(unknownFields).length > 0) {
        return res.status(400).json({
            error: `Cannot update ${Object.keys(unknownFields).join(', ')}. Allowed fields: name, homeAddress, password`
        });
    }

    if (name === undefined && homeAddress === undefined && password === undefined) {
        return res.status(400).json({
            error: 'At least one of name, homeAddress or password is required'
        });
    }

    if (
        (name !== undefined && name !== null && typeof name !== 'string') ||
        (homeAddress !== undefined && homeAddress !== null && typeof homeAddress !== 'string')
    ) {
        return res.status(400).json({
            error: 'name and homeAddress must be strings'
        });
    }

    if (password !== undefined && (typeof password !== 'string' || password.length < 8)) {
        return res.status(400).json({
            error: 'password must be at least 8 characters'
        });
    }

    const fields = {};

    if (name !== undefined) {
        fields.name = typeof name === 'string' && name.trim() !== ''
            ? name.trim()
            : null;
    }

    if (homeAddress !== undefined) {
        fields.homeAddress = typeof homeAddress === 'string' && homeAddress.trim() !== ''
            ? homeAddress.trim()
            : null;
    }

    if (password !== undefined) {
        fields.password = password;
    }

    if (fields.name && fields.name.length > 255) {
        return res.status(400).json({
            error: 'name must be at most 255 characters'
        });
    }

    try {
        const user = await User.update(username, fields);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.status(204).end();

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to update user'
        });
    }
}
