const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/streak");
router.use(auth);
router.post("/ping", c.ping);
router.get("/status", c.status);
module.exports = router;
