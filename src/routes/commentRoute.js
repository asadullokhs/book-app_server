const router = require("express").Router();
const commentCtrl = require("../controllers/commentCrtl");

router.post("/comment/:id", commentCtrl.add);
router.delete("/comment/:commentId", commentCtrl.delete);
router.put("/comment/:id", commentCtrl.update);

module.exports = router;
