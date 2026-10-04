-- =========================
-- AUTHORS
-- =========================

INSERT INTO authors (
    first_name,
    last_name,
    biography,
    publisher
)
VALUES
(
    'George',
    'Orwell',
    'English novelist known for political and dystopian fiction.',
    'Secker & Warburg'
),
(
    'J.K.',
    'Rowling',
    'British author known for fantasy novels.',
    'Bloomsbury'
),
(
    'J.R.R.',
    'Tolkien',
    'English writer known for fantasy literature.',
    'George Allen & Unwin'
),
(
    'Frank',
    'Herbert',
    'American science fiction author best known for the Dune series.',
    'Ace'
),
(
    'David',
    'Goggins',
    'Author and endurance athlete known for books about discipline and mental toughness.',
    'Lioncrest Publishing'
),
(
    'Frank',
    'Miller',
    'Comic book writer and artist known for major Batman stories.',
    'DC Comics'
),
(
    'Alan',
    'Moore',
    'English comic book writer known for influential graphic novels.',
    'DC Comics'
),
(
    'Mark',
    'Millar',
    'Comic book writer known for major Marvel and creator-owned stories.',
    'Marvel Comics'
),
(
    'Morgan',
    'Housel',
    'Author known for writing about money, investing, and human behavior.',
    'Harriman House'
),
(
    'Robert',
    'Kiyosaki',
    'Author and entrepreneur known for personal finance books.',
    'Plata Publishing'
),
(
    'Eric',
    'Ries',
    'Entrepreneur and author focused on startup development.',
    'Crown Currency'
),
(
    'James',
    'Clear',
    'Author focused on habits and personal improvement.',
    'Avery'
),
(
    'Timothy',
    'Ferriss',
    'Author and entrepreneur known for books about productivity and business.',
    'Harmony'
),
(
    'Phil',
    'Knight',
    'Entrepreneur and founder of Nike.',
    'Scribner'
),
(
    'Benjamin',
    'Graham',
    'Investor and author known for value investing principles.',
    'HarperBusiness'
);


-- =========================
-- BOOKS
-- =========================

INSERT INTO books (
    isbn,
    name,
    description,
    price,
    author_id,
    genre,
    publisher,
    year_published,
    copies_sold
)
VALUES

(
    '9780451524935',
    '1984',
    'A dystopian novel about surveillance and totalitarian government.',
    12.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'George' AND last_name = 'Orwell' LIMIT 1),
    'Dystopian',
    'Secker & Warburg',
    1949,
    5000
),

(
    '9780451526342',
    'Animal Farm',
    'A political satire involving animals living on a farm.',
    9.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'George' AND last_name = 'Orwell' LIMIT 1),
    'Political Fiction',
    'Secker & Warburg',
    1945,
    3500
),

(
    '9780439708180',
    'Harry Potter and the Sorcerer''s Stone',
    'A young wizard discovers the magical world.',
    14.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'J.K.' AND last_name = 'Rowling' LIMIT 1),
    'Fantasy',
    'Bloomsbury',
    1997,
    10000
),

(
    '9780547928227',
    'The Hobbit',
    'Bilbo Baggins begins an unexpected adventure.',
    13.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'J.R.R.' AND last_name = 'Tolkien' LIMIT 1),
    'Fantasy',
    'George Allen & Unwin',
    1937,
    8000
),

(
    '9780441172719',
    'Dune',
    'A science fiction novel centered on politics, power, and survival on the planet Arrakis.',
    14.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Frank' AND last_name = 'Herbert' LIMIT 1),
    'Science Fiction',
    'Ace',
    1965,
    9000
),

(
    '9780593098233',
    'Dune Messiah',
    'The continuation of Paul Atreides and the political consequences of his rise to power.',
    12.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Frank' AND last_name = 'Herbert' LIMIT 1),
    'Science Fiction',
    'Ace',
    1969,
    7000
),

(
    '9781544512280',
    'Can''t Hurt Me',
    'A memoir focused on discipline, endurance, and overcoming personal limits.',
    19.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'David' AND last_name = 'Goggins' LIMIT 1),
    'Self-Improvement',
    'Lioncrest Publishing',
    2018,
    11000
),

(
    '9781544534077',
    'Never Finished',
    'A book about continuing personal development and pushing beyond perceived limits.',
    24.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'David' AND last_name = 'Goggins' LIMIT 1),
    'Self-Improvement',
    'Lioncrest Publishing',
    2022,
    8000
),

(
    '9781401207526',
    'Batman: Year One',
    'A graphic novel exploring the beginning of Batman''s career in Gotham City.',
    14.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Frank' AND last_name = 'Miller' LIMIT 1),
    'Superhero',
    'DC Comics',
    1987,
    7500
),

(
    '9781563893421',
    'Batman: The Dark Knight Returns',
    'A graphic novel about an older Bruce Wayne returning to fight crime.',
    19.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Frank' AND last_name = 'Miller' LIMIT 1),
    'Superhero',
    'DC Comics',
    1986,
    8500
),

(
    '9781401245252',
    'Watchmen',
    'A graphic novel examining superheroes, power, and morality.',
    24.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Alan' AND last_name = 'Moore' LIMIT 1),
    'Superhero',
    'DC Comics',
    1987,
    9500
),

(
    '9780785121794',
    'Civil War',
    'A Marvel story centered on conflict between superheroes over government registration.',
    24.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Mark' AND last_name = 'Millar' LIMIT 1),
    'Superhero',
    'Marvel Comics',
    2007,
    7200
),

(
    '9780857197689',
    'The Psychology of Money',
    'A book exploring how behavior and psychology affect financial decisions.',
    19.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Morgan' AND last_name = 'Housel' LIMIT 1),
    'Finance',
    'Harriman House',
    2020,
    12000
),

(
    '9781612680194',
    'Rich Dad Poor Dad',
    'A personal finance book focused on money, assets, and financial education.',
    16.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Robert' AND last_name = 'Kiyosaki' LIMIT 1),
    'Finance',
    'Plata Publishing',
    1997,
    15000
),

(
    '9780307887894',
    'The Lean Startup',
    'A business book about building and testing startup ideas through continuous learning.',
    18.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Eric' AND last_name = 'Ries' LIMIT 1),
    'Business',
    'Crown Currency',
    2011,
    8500
),

(
    '9780735211292',
    'Atomic Habits',
    'A book about building better habits through small and consistent improvements.',
    21.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'James' AND last_name = 'Clear' LIMIT 1),
    'Self-Improvement',
    'Avery',
    2018,
    16000
),

(
    '9780307465351',
    'The 4-Hour Workweek',
    'A book about productivity, entrepreneurship, and redesigning how work is approached.',
    20.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Timothy' AND last_name = 'Ferriss' LIMIT 1),
    'Business',
    'Harmony',
    2009,
    10500
),

(
    '9781501135927',
    'Shoe Dog',
    'Phil Knight''s memoir about building Nike from an early startup into a global company.',
    20.00,
    (SELECT author_id FROM authors
     WHERE first_name = 'Phil' AND last_name = 'Knight' LIMIT 1),
    'Business',
    'Scribner',
    2016,
    13000
),

(
    '9780060555665',
    'The Intelligent Investor',
    'A classic book focused on long-term investing and value investing principles.',
    18.99,
    (SELECT author_id FROM authors
     WHERE first_name = 'Benjamin' AND last_name = 'Graham' LIMIT 1),
    'Finance',
    'HarperBusiness',
    1949,
    14000
);

-- =========================
-- USERS
-- =========================

INSERT INTO users (
    username,
    password_hash,
    name,
    email_address,
    home_address
)
VALUES
(
    'jdoe',
    'b4d226508079e5d0cb8eabbf8d019e9d:2b8af11a1f3d4382d5fdb1c746c5e99c698150603baf638129dd8c98ba00d4b17adaa382b4b1e2ac38cfe682c781f970b938fd015245bef18ccc7bd5e53f47f6',
    'John Doe',
    'jdoe@example.com',
    '123 Maple Street, Miami, FL 33101'
),
(
    'asmith',
    'b962cf0f4ae21ac2aa3c0b567aa3494b:8d5a50ca86295ae71d4efcf217db4a3bdca50b73f7375daab0877c69336213124c7d097d0abd9f2f506eae35782a72d586fa7b3a73c2453e6a0d78e8773c9d0f',
    'Alice Smith',
    'asmith@example.com',
    '456 Oak Avenue, Orlando, FL 32801'
),
(
    'bwayne',
    '002994d3f29a29d532e3fcb0c13192b1:b1c03ae546434bea0fe82f9506a10c2efb6e3f4eb622f45c0d0683edc019a04048b49b807ba3d0408dbf1fefad1687306e8039ce016983c0522e38a97908293f',
    'Bruce Wayne',
    'bwayne@example.com',
    '1007 Mountain Drive, Gotham, NJ 07001'
),
(
    'creader',
    'b2d003f9bd0d5e805776c95b10025ede:20665aff253e1bb04d5b7ad9dd7c4173a7c200ea95ad5d49427258b235ca1cbd181f54c359961530c94145fa8f8868d98dfad3ac748b3c73422d9f3e8339806b',
    'Carol Reader',
    'creader@example.com',
    NULL
),
(
    'minimal',
    '75ea5e7955d68c644978984fe9ebb23a:0c815870f585dcebd1317e2494f62b06a4b425100188238a0e615c4ff70ecdb14e2747cdf8b1caf6c8a1a3cff2bb668f1c16708caabf5aee6e1cb719001090ca',
    NULL,
    NULL,
    NULL
);