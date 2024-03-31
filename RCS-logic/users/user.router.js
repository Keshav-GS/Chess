const { 
    login,
    signUp,
    logout,
    gameover,
    sendFen,
    sendProfileDetails,
    saveFeedback
} = require("./user.controller");

const{getUserIdByUsername}=require("./user.service");
const router = require("express").Router();
const { requireAuthentication } = require("../../auth/session");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.get("/", (req, res) => {
    res.redirect("ChessWebsite/login");
});
router.get("/login", (req, res) => {
    res.render("login");
});

/*Here, we can see same route "/login" but with 2 different endpoints .get and .post*/

router.post("/login", login);
router.post("/signup", signUp);
router.post("/home/submitFeedback", requireAuthentication, saveFeedback);
router.post("/playBot/GameOver", requireAuthentication, gameover);
router.post("/boardToFen/process_image", requireAuthentication, upload.single("image"), sendFen);

router.get("/home", requireAuthentication, (req, res) => {
    res.render("home", {userName: req.session.userName});
});
router.get("/profile", requireAuthentication, sendProfileDetails);
router.get("/playUser", requireAuthentication, (req, res) => {
    res.render("playUser");
});
router.get("/playBot", requireAuthentication, (req, res) => {
    res.render("playBot", {userName: req.session.userName});
});
router.get('/playBot/get-username', (req, res) => {
    const whiteUsername = req.session.userName;
    res.json({ whiteUsername});
});
router.get('/playBot/get-userid',async (req,res)=>{
   const uid=await getUserIdByUsername(req.session.userName).catch(() => -1)
   res.json({uid});
});
router.get("/chat", requireAuthentication, (req, res) => {
    res.render("chat");
});
router.get("/boardToFen", requireAuthentication, (req, res) => {
    res.render("boardToFen", {userName: req.session.userName});
});
router.get("/logout", requireAuthentication, logout); 

module.exports = router;