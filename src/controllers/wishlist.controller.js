import * as Wishlist from "../models/wishlist.model.js";

const MAX_INTEGER = 2147483647;

export async function getBooks(req, res) {
  const { wishlistId } = req.params;

  if (!/^\d+$/.test(wishlistId) || Number(wishlistId) > MAX_INTEGER) {
    return res.status(400).json({
      error: "wishlistId must be a positive integer",
    });
  }

  try {
    if (!(await Wishlist.exists(wishlistId))) {
      return res.status(404).json({
        error: "Wishlist not found",
      });
    }

    const books = await Wishlist.findBooks(wishlistId);

    res.json(books);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to retrieve wishlist books",
    });
  }
}

export async function createWishlist(req, res) {
  const { userId, name } = req.body || {};

  if (!userId || !name) {
    return res.status(400).json({
      error: "userId and name are required",
    });
  }

  try {
    if (!(await Wishlist.userExists(userId))) {
      return res.status(404).json({
        error: "User not found",
      });
    }
    const wishlistCount = await Wishlist.countByUser(userId);

    if (wishlistCount >= 3) {
      return res.status(409).json({
        error: "User cannot have more than 3 wishlists",
      });
    }

    const wishlist = await Wishlist.create(userId, name);

    res.status(201).json(wishlist);
  } catch (error) {
    console.error(error);
    if (
      error.code === "23505" &&
      error.constraint === "unique_user_wishlist_name"
    ) {
      return res.status(409).json({
        error: "A wishlist with this name already exists for the user",
      });
    }
    if (error.code === "23503") {
      return res.status(404).json({
        error: "User not found",
      });
    }
    res.status(500).json({
      error: "Failed to create wishlist",
    });
  }
}
export async function addBook(req, res) {
  const { wishlistId, bookId } = req.params;

  if (
    !/^\d+$/.test(wishlistId) ||
    !/^\d+$/.test(bookId) ||
    Number(wishlistId) > MAX_INTEGER ||
    Number(bookId) > MAX_INTEGER
  ) {
    return res.status(400).json({
      error: "wishlistId and bookId must be positive integers",
    });
  }

  try {
    if (!(await Wishlist.exists(wishlistId))) {
      return res.status(404).json({
        error: "Wishlist not found",
      });
    }

    if (!(await Wishlist.bookExists(bookId))) {
      return res.status(404).json({
        error: "Book not found",
      });
    }

    const wishlistBook = await Wishlist.addBook(wishlistId, bookId);

    res.status(201).json(wishlistBook);
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "Book is already in wishlist",
      });
    }
    if (error.code === "23503") {
      return res.status(404).json({
        error: "Wishlist or book not found",
      });
    }
    res.status(500).json({
      error: "Failed to add book to wishlist",
    });
  }
}
export async function removeBook(req, res) {
  const { wishlistId, bookId } = req.params;

  if (
    !/^\d+$/.test(wishlistId) ||
    !/^\d+$/.test(bookId) ||
    Number(wishlistId) > MAX_INTEGER ||
    Number(bookId) > MAX_INTEGER
  ) {
    return res.status(400).json({
      error: "wishlistId and bookId must be positive integers",
    });
  }

  try {
    if (!(await Wishlist.exists(wishlistId))) {
      return res.status(404).json({
        error: "Wishlist not found",
      });
    }

    const removedBook = await Wishlist.removeBook(wishlistId, bookId);

    if (!removedBook) {
      return res.status(404).json({
        error: "Book not found in wishlist",
      });
    }

    res.json(removedBook);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to remove book from wishlist",
    });
  }
}
export async function deleteWishlist(req, res) {
  const { wishlistId } = req.params;

  if (!/^\d+$/.test(wishlistId) || Number(wishlistId) > MAX_INTEGER) {
    return res.status(400).json({
      error: "wishlistId must be a positive integer",
    });
  }

  try {
    const deletedWishlist = await Wishlist.remove(wishlistId);

    if (!deletedWishlist) {
      return res.status(404).json({
        error: "Wishlist not found",
      });
    }

    res.json(deletedWishlist);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to delete wishlist",
    });
  }
}
export async function renameWishlist(req, res) {
  const { wishlistId } = req.params;
  const { name } = req.body || {};

  if (!/^\d+$/.test(wishlistId) || Number(wishlistId) > MAX_INTEGER) {
    return res.status(400).json({
      error: "wishlistId must be a positive integer",
    });
  }

  if (!name) {
    return res.status(400).json({
      error: "name is required",
    });
  }

  try {
    const updatedWishlist = await Wishlist.rename(wishlistId, name);

    if (!updatedWishlist) {
      return res.status(404).json({
        error: "Wishlist not found",
      });
    }

    res.json(updatedWishlist);
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "A wishlist with this name already exists for the user",
      });
    }

    res.status(500).json({
      error: "Failed to rename wishlist",
    });
  }
}
export async function getUserWishlists(req, res) {
  const { userId } = req.params;

  if (!/^\d+$/.test(userId) || Number(userId) > MAX_INTEGER) {
    return res.status(400).json({
      error: "userId must be a positive integer",
    });
  }

  try {
    if (!(await Wishlist.userExists(userId))) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const wishlists = await Wishlist.findByUser(userId);

    res.json(wishlists);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to retrieve user wishlists",
    });
  }
}
