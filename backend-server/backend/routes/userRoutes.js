import express from 'express';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getGermanContentBasedOnId,
  storeUserChatHistory,
  storeUserCompletedLessons,
  fetchGivenUserCompletedLessons,
  calculateAndSendUserProgressPercentage,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', registerUser);
router.post('/auth', authUser);
router.post('/logout', logoutUser);
router.post('/get/german/content', getGermanContentBasedOnId);
router.post('/store/user/chat/history', storeUserChatHistory);
router.post('/store/user/completed/lessons', storeUserCompletedLessons);
router.post('/fetch/given/user/completed/lessons', fetchGivenUserCompletedLessons);
router.post('/get/user/progress/percentage', calculateAndSendUserProgressPercentage);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;
