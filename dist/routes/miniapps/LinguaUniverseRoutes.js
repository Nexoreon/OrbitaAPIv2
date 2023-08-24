"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../../controllers/authController");
const wordController_1 = require("../../controllers/miniapps/LinguaUniverse/wordController");
const wordSetController_1 = require("../../controllers/miniapps/LinguaUniverse/wordSetController");
const mainController_1 = require("../../controllers/miniapps/LinguaUniverse/mainController");
const achievementsController_1 = require("../../controllers/achievementsController");
const router = (0, express_1.Router)();
router.route('/words')
    .get(authController_1.protect, wordController_1.getWords)
    .post(authController_1.protect, wordController_1.addWord)
    .delete(authController_1.protect, wordController_1.deleteWords);
router.get('/words/getUserUnlearnedWords', authController_1.protect, mainController_1.getUserUnlearnedWords);
router.get('/words/getPossibleAnswers', authController_1.protect, mainController_1.getPossibleAnswers);
router.get('/words/getUserDictionary', authController_1.protect, mainController_1.getUserDictionary);
router.patch('/words/resetStatus', authController_1.protect, wordController_1.resetStatus);
router.patch('/words/markAsLearned', authController_1.protect, wordController_1.markAsLearned, achievementsController_1.updateProgress);
router.route('/words/:id')
    .get(authController_1.protect, wordController_1.getWord)
    .patch(authController_1.protect, wordController_1.updateWord)
    .delete(authController_1.protect, wordController_1.deleteWord);
// WordSets
router.route('/wordsets')
    .get(authController_1.protect, wordSetController_1.getWordSet)
    .post(authController_1.protect, wordSetController_1.createWordSet);
router.get('/wordsets/getUserWordSets', authController_1.protect, wordSetController_1.getUserWordSets);
router.get('/wordsets/getUserWordSet/:id', authController_1.protect, wordSetController_1.getUserWordSet);
router.route('/wordsets/:id')
    .get(authController_1.protect, wordSetController_1.getWordSet)
    .patch(authController_1.protect, wordSetController_1.updateWordSet)
    .delete(authController_1.protect, wordSetController_1.deleteWordSet);
exports.default = router;
