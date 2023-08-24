import { Router } from 'express';
import { protect } from '../controllers/authController';
import { createPost, deleteAllPosts, deletePost, deletePosts, getAllPosts, getPost, getPosts, movePosts, updatePost } from '../controllers/forum/postController';
import { getCategoryData, getForumData, getTopicData } from '../controllers/forum/forumController';
import {
    createCategory,
    deleteCategory,
    getAllCategories,
    getAllSubCategories,
    getCategory,
    getEverything,
    updateCategory,
} from '../controllers/forum/categoryController';
import {
    createTopic,
    deleteAllTopics,
    getTopics,
    getAllTopics,
    moveTopic,
    moveTopics,
    updateTopics,
    deleteTopics,
    getTopic,
    updateTopic,
    deleteTopic,
} from '../controllers/forum/topicController';

const router = Router();

// Categories
router.route('/categories')
.get(protect, getEverything)
.post(protect, createCategory);

router.get('/categories/getCategories', protect, getAllCategories);
router.get('/categories/getSubCategories', protect, getAllSubCategories);

router.route('/categories/:id')
.get(protect, getCategory)
.patch(protect, updateCategory)
.delete(protect, deleteCategory, deleteAllTopics, deleteAllPosts);

// Topics
router.route('/topics')
.get(protect, getAllTopics)
.post(protect, createTopic, createPost);

router.get('/topics/getTopics', protect, getTopics);
router.patch('/topics/moveTopic', protect, moveTopic);
router.patch('/topics/moveTopics', protect, moveTopics);
router.patch('/topics/updateTopics', protect, updateTopics);
router.delete('/topics/deleteTopics', protect, deleteTopics);

router.route('/topics/:id')
.get(protect, getTopic)
.patch(protect, updateTopic)
.delete(protect, deleteTopic);

// Posts
router.route('/posts')
.get(protect, getAllPosts)
.post(protect, createPost);

router.post('/posts/getPosts', protect, getPosts);
router.delete('/posts/deletePosts', protect, deletePosts);
router.patch('/posts/movePosts', protect, movePosts);

router.route('/posts/:id')
.get(protect, getPost)
.patch(protect, updatePost)
.delete(protect, deletePost);

// Common
router.get('/getForumData', protect, getForumData);
router.get('/getCategoryData/:categoryUrl', protect, getCategoryData);
router.get('/getTopicData/:topicUrl', protect, getTopicData);

export default router;
