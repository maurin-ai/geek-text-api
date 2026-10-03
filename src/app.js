const express = require('express');
const pool = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const authorRoutes = require('./routes/authorRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

const app = express();

app.use(express.json());

app.use('/books', bookRoutes);
app.use('/authors', authorRoutes);
app.use('/wishlists', wishlistRoutes);

app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');

        res.json({
            message: 'Geek Text API is running',
            database_time: result.rows[0].now
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Database connection failed'
        });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
