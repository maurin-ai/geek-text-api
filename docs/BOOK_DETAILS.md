# Book Details - Developer Documentation

## Overview

The Book Details feature is responsible for creating authors and books and retrieving book information from the Geek Text API.

This feature was developed and tested by Mauro Alonso for Team 10.

The main Book Details endpoints are:

- Create an author
- Create a book
- Get a book by ISBN
- Get all books from an author

---

## Base URL

```text
http://localhost:3000
```

---

## 1. Create an Author

### Endpoint

```http
POST /authors
```

### Example Request

```json
{
  "first_name": "Brandon",
  "last_name": "Sanderson",
  "biography": "Fantasy author",
  "publisher": "Tor Books"
}
```

### Successful Response

```text
201 Created
```

### Main Validation

- `first_name` is required
- `last_name` is required
- First and last name cannot be empty strings

---

## 2. Create a Book

### Endpoint

```http
POST /books
```

### Example Request

```json
{
  "isbn": "9780765326355",
  "name": "The Way of Kings",
  "description": "Fantasy novel",
  "price": 24.99,
  "author_id": 1,
  "genre": "Fantasy",
  "publisher": "Tor Books",
  "year_published": 2010,
  "copies_sold": 100
}
```

### Successful Response

```text
201 Created
```

### Main Validation

- ISBN must contain exactly 13 digits
- Book name is required
- Price must be a non-negative number
- `author_id` must reference an existing author
- Duplicate ISBN values are rejected
- `year_published`, when provided, must be valid
- `copies_sold` cannot be negative

### Common Error Responses

```text
400 Bad Request
```

Used for invalid input or a nonexistent author.

```text
409 Conflict
```

Used when a book with the same ISBN already exists.

---

## 3. Get a Book by ISBN

### Endpoint

```http
GET /books/:isbn
```

### Example

```http
GET /books/9780765326355
```

### Successful Response

```text
200 OK
```

The response contains the information for the requested book.

### Book Not Found

```text
404 Not Found
```

---

## 4. Get Books by Author

### Endpoint

```http
GET /authors/:authorId/books
```

### Example

```http
GET /authors/1/books
```

### Successful Response

```text
200 OK
```

The response contains an array with the books belonging to the author.

### Validation

The author ID must be a positive integer.

### Author Not Found

```text
404 Not Found
```

---

## Automated Testing

Book Details includes an automated test suite located at:

```text
tests/book-details.test.js
```

Run the tests with:

```bash
node --test tests/book-details.test.js
```

The test suite currently contains 13 tests.

It verifies:

- Creating an author
- Rejecting missing author information
- Rejecting empty author names
- Creating a book
- Getting a book by ISBN
- Getting books by author
- Rejecting duplicate ISBN values
- Rejecting books with nonexistent authors
- Rejecting invalid ISBN values
- Rejecting negative prices
- Returning 404 for nonexistent books
- Returning 404 for nonexistent authors
- Rejecting invalid author IDs

Current test result:

```text
13 tests
13 passed
0 failed
```

---

## Sprint 5 Smoke Test

The Book Details endpoints were smoke tested in sequence during Sprint 5.

Results:

```text
POST /authors                  201 Created
POST /books                    201 Created
GET /books/:isbn               200 OK
GET /authors/:authorId/books   200 OK
```

All four Book Details routes passed the Sprint 5 smoke test.

---

## Project Structure

The main files related to Book Details are located in:

```text
src/routes/
src/controllers/
src/models/
tests/book-details.test.js
```

The feature uses PostgreSQL for storing authors and books and Express for the REST API.
