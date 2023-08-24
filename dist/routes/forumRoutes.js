"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const postController_1 = require("../controllers/forum/postController");
const forumController_1 = require("../controllers/forum/forumController");
const categoryController_1 = require("../controllers/forum/categoryController");
const topicController_1 = require("../controllers/forum/topicController");
const router = (0, express_1.Router)();
// Categories
router.route('/categories')
    .get(authController_1.protect, categoryController_1.getEverything)
    .post(authController_1.protect, categoryController_1.createCategory);
router.get('/categories/getCategories', authController_1.protect, categoryController_1.getAllCategories);
router.get('/categories/getSubCategories', authController_1.protect, categoryController_1.getAllSubCategories);
router.route('/categories/:id')
    .get(authController_1.protect, categoryController_1.getCategory)
    .patch(authController_1.protect, categoryController_1.updateCategory)
    .delete(authController_1.protect, categoryController_1.deleteCategory, topicController_1.deleteAllTopics, postController_1.deleteAllPosts);
// Topics
router.route('/topics')
    .get(authController_1.protect, topicController_1.getAllTopics)
    .post(authController_1.protect, topicController_1.createTopic, postController_1.createPost);
router.get('/topics/getTopics', authController_1.protect, topicController_1.getTopics);
router.patch('/topics/moveTopic', authController_1.protect, topicController_1.moveTopic);
router.patch('/topics/moveTopics', authController_1.protect, topicController_1.moveTopics);
router.patch('/topics/updateTopics', authController_1.protect, topicController_1.updateTopics);
router.delete('/topics/deleteTopics', authController_1.protect, topicController_1.deleteTopics);
router.route('/topics/:id')
    .get(authController_1.protect, topicController_1.getTopic)
    .patch(authController_1.protect, topicController_1.updateTopic)
    .delete(authController_1.protect, topicController_1.deleteTopic);
// Posts
router.route('/posts')
    .get(authController_1.protect, postController_1.getAllPosts)
    .post(authController_1.protect, postController_1.createPost);
router.post('/posts/getPosts', authController_1.protect, postController_1.getPosts);
router.delete('/posts/deletePosts', authController_1.protect, postController_1.deletePosts);
router.patch('/posts/movePosts', authController_1.protect, postController_1.movePosts);
router.route('/posts/:id')
    .get(authController_1.protect, postController_1.getPost)
    .patch(authController_1.protect, postController_1.updatePost)
    .delete(authController_1.protect, postController_1.deletePost);
// Common
router.get('/getForumData', authController_1.protect, forumController_1.getForumData);
router.get('/getCategoryData/:categoryUrl', authController_1.protect, forumController_1.getCategoryData);
router.get('/getTopicData/:topicUrl', authController_1.protect, forumController_1.getTopicData);
exports.default = router;
