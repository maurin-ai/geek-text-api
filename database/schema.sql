CREATE TABLE authors (
    author_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    biography TEXT,
    publisher VARCHAR(255)
);

CREATE TABLE books (
    book_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    isbn VARCHAR(13) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    author_id INTEGER NOT NULL,
    genre VARCHAR(100),
    publisher VARCHAR(255),
    year_published INTEGER,
    copies_sold INTEGER DEFAULT 0 CHECK (copies_sold >= 0),

    CONSTRAINT fk_author
        FOREIGN KEY (author_id)
        REFERENCES authors(author_id)
);

CREATE TABLE users (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255),
    email_address VARCHAR(255),
    home_address TEXT
);

CREATE TABLE wishlists (
    wishlist_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,

    CONSTRAINT unique_user_wishlist_name
        UNIQUE (user_id, name),

    CONSTRAINT fk_wishlist_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE wishlist_books (
    wishlist_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,

    PRIMARY KEY (wishlist_id, book_id),

    CONSTRAINT fk_wishlist
        FOREIGN KEY (wishlist_id)
        REFERENCES wishlists(wishlist_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_wishlist_book
        FOREIGN KEY (book_id)
        REFERENCES books(book_id)
        ON DELETE CASCADE
);