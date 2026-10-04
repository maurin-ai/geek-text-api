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