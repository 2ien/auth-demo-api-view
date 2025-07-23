const express = require('express');
const postsController = require('../controllers/postsController');
const { identifier } = require('../middlewares/identification'); // hoặc requireAuth
const router = express.Router();

// RESTful API
router.get('/', postsController.getPosts); // GET /api/posts
router.get('/:id', postsController.singlePost); // GET /api/posts/:id
router.post('/', identifier, postsController.createPost); // POST /api/posts
router.put('/:id', identifier, postsController.updatePost); // PUT /api/posts/:id
router.delete('/:id', identifier, postsController.deletePost); // DELETE /api/posts/:id

module.exports = router;
