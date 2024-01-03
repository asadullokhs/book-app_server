const router = require("express").Router();
const userCtrl = require("../controllers/userCtrl");

router.post("/signUp", userCtrl.signUp);
router.post("/login", userCtrl.login);
router.get("/users", userCtrl.getAll);
router.get("/user/:userId", userCtrl.getOne);
router.delete("/user/:userId", userCtrl.delete);
router.put("/user/:userId", userCtrl.update);

module.exports = router;
