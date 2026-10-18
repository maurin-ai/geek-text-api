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
