const router = require("express").Router();
const categoryCtrl = require("../controllers/categoryCtrl");

router.post("/category", categoryCtrl.add);
router.get("/category", categoryCtrl.get);
router.get("/category/:bookId", categoryCtrl.getOne);
router.delete("/category/:id", categoryCtrl.delete);
router.put("/category/:id", categoryCtrl.update);

module.exports = router;
