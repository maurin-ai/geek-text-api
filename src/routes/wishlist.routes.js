import express from "express";
import * as wishlistController from "../controllers/wishlist.controller.js";

const router = express.Router();

router.post("/", wishlistController.createWishlist);
router.post("/:wishlistId/books/:bookId", wishlistController.addBook);
router.delete("/:wishlistId/books/:bookId", wishlistController.removeBook);
router.delete("/:wishlistId", wishlistController.deleteWishlist);
router.patch("/:wishlistId", wishlistController.renameWishlist);
router.get("/user/:userId", wishlistController.getUserWishlists);
router.get("/:wishlistId/books", wishlistController.getBooks);

export default router;
