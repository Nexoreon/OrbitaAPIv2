import { Router } from 'express';
import { protect } from '../../controllers/authController';
import {
    addWord,
    deleteWord,
    deleteWords,
    getWord,
    getWords,
    markAsLearned,
    resetStatus,
    updateWord,
} from '../../controllers/miniapps/LinguaUniverse/wordController';
import {
    createWordSet,
    deleteWordSet,
    getUserWordSet,
    getUserWordSets,
    getWordSet,
    updateWordSet,
} from '../../controllers/miniapps/LinguaUniverse/wordSetController';
import { getPossibleAnswers, getUserDictionary, getUserUnlearnedWords } from '../../controllers/miniapps/LinguaUniverse/mainController';
import { updateProgress } from '../../controllers/achievementsController';

const router = Router();

router.route('/words')
.get(protect, getWords)
.post(protect, addWord)
.delete(protect, deleteWords);

router.get('/words/getUserUnlearnedWords', protect, getUserUnlearnedWords);
router.get('/words/getPossibleAnswers', protect, getPossibleAnswers);
router.get('/words/getUserDictionary', protect, getUserDictionary);
router.patch('/words/resetStatus', protect, resetStatus);
router.patch('/words/markAsLearned', protect, markAsLearned, updateProgress);

router.route('/words/:id')
.get(protect, getWord)
.patch(protect, updateWord)
.delete(protect, deleteWord);

// WordSets

router.route('/wordsets')
.get(protect, getWordSet)
.post(protect, createWordSet);

router.get('/wordsets/getUserWordSets', protect, getUserWordSets);
router.get('/wordsets/getUserWordSet/:id', protect, getUserWordSet);

router.route('/wordsets/:id')
.get(protect, getWordSet)
.patch(protect, updateWordSet)
.delete(protect, deleteWordSet);

export default router;
