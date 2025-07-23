const express = require('express');
const postsController = require('../controllers/postsController');
const { identifier } = require('../middlewares/identification');
const router = express.Router();

router.get('/all-posts', postsController.getPosts);
router.get('/single-post/:id', postsController.singlePost);
router.post('/create-post', identifier, postsController.createPost);
router.put('/update-post/:id', identifier, postsController.updatePost);
router.delete('/delete-post/:id', identifier, postsController.deletePost);


module.exports = router;
