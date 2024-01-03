const router = require("express").Router();
const BookCtrl = require("../controllers/bookCtrl");

router.post("/book", BookCtrl.add);
router.get("/book/:bookId", BookCtrl.getOne);
router.get("/books", BookCtrl.getAll);
router.delete("/book/:bookId", BookCtrl.delete);
router.put("/book/:bookId", BookCtrl.update);
router.get("/like/:bookId", BookCtrl.likeBook);
router.get("/dislike/:bookId", BookCtrl.dislikeBook);
router.get("/download/:bookId", BookCtrl.download);

module.exports = router;
