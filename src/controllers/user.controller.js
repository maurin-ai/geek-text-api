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

export async function createCreditCard(req, res) {
    const { username } = req.params;
    const { cardNumber, expirationDate, cvv, cardholderName } = req.body || {};

    if (cardNumber === undefined || expirationDate === undefined || cvv === undefined) {
        return res.status(400).json({
            error: 'cardNumber, expirationDate and cvv are required'
        });
    }

    if (
        typeof cardNumber !== 'string' ||
        typeof expirationDate !== 'string' ||
        typeof cvv !== 'string' ||
        (cardholderName !== undefined && cardholderName !== null && typeof cardholderName !== 'string')
    ) {
        return res.status(400).json({
            error: 'cardNumber, expirationDate, cvv and cardholderName must be strings'
        });
    }

    const digits = cardNumber.replace(/[\s-]/g, '');

    if (!/^\d{13,19}$/.test(digits)) {
        return res.status(400).json({
            error: 'cardNumber must be 13 to 19 digits'
        });
    }

    let sum = 0;

    for (let i = 0; i < digits.length; i++) {
        let digit = Number(digits[digits.length - 1 - i]);

        if (i % 2 === 1) {
            digit *= 2;

            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
    }

    if (sum % 10 !== 0) {
        return res.status(400).json({
            error: 'cardNumber is not a valid card number'
        });
    }

    const trimmedExpirationDate = expirationDate.trim();
    const expiration = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(trimmedExpirationDate);

    if (!expiration) {
        return res.status(400).json({
            error: 'expirationDate must be in MM/YY format'
        });
    }

    const expirationMonth = Number(expiration[1]);
    const expirationYear = 2000 + Number(expiration[2]);
    const now = new Date();

    if (
        expirationYear < now.getFullYear() ||
        (expirationYear === now.getFullYear() && expirationMonth < now.getMonth() + 1)
    ) {
        return res.status(400).json({
            error: 'Credit card is expired'
        });
    }

    if (!/^\d{3,4}$/.test(cvv)) {
        return res.status(400).json({
            error: 'cvv must be 3 or 4 digits'
        });
    }

    const trimmedCardholderName = typeof cardholderName === 'string' && cardholderName.trim() !== ''
        ? cardholderName.trim()
        : null;

    if (trimmedCardholderName && trimmedCardholderName.length > 255) {
        return res.status(400).json({
            error: 'cardholderName must be at most 255 characters'
        });
    }

    try {
        const user = await User.findByUsername(username);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        await User.createCreditCard(user.user_id, {
            cardNumber: digits,
            expirationDate: trimmedExpirationDate,
            cardholderName: trimmedCardholderName
        });

        res.status(201).end();

    } catch (error) {
        console.error(error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'This credit card is already saved for this user'
            });
        }

        res.status(500).json({
            error: 'Failed to create credit card'
        });
    }
}
