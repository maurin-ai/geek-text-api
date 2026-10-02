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