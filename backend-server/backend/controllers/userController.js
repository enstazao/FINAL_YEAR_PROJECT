import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userChatHistory: user.userChatHistory,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userChatHistory: user.userChatHistory,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc  Get German Content Based on ID
// @route POST /api/users/get/german/content
const getGermanContentBasedOnId = asyncHandler(async (req, res) => {

  const id = req.body.id;

  // Read the JSON file
  const filePath = path.join(__dirname, '..', 'data', 'german_content.json');
  const jsonData = fs.readFileSync(filePath, 'utf8');
  const germanContent = JSON.parse(jsonData);
  console.log(germanContent, 'hello');
  // Find the index of the document with the specified ID
  const currentIndex = germanContent.findIndex(item => item.id == id);

  if (currentIndex === -1 || currentIndex === germanContent.length - 1) {
    res.status(404);
    throw new Error('Document not found or already at the end');
  }

  // Return the next document in the response
  const nextDocument = germanContent[currentIndex];
  res.json(nextDocument);
});


// @desc  Store User Chat History
// @route POST /api/users/store/user/chat/history
const storeUserChatHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body._id);
  const newChatHistory = req.body.userChatHistory; 
  // console.log(newChatHistory);

  if (user) {
    user.userChatHistory = newChatHistory; 
    console.log(user);

    try {
      await user.save();
      res.json({ message: 'Chat history updated successfully.' }); 
    } catch (error) {
      res.status(500).json({ error: error.message });
    }

  } else {
    res.status(404);
    throw new Error("User not found");
  }
});


// @desc  Store user completed lessons
// @route POST /api/users/store/user/completed/lessons
const storeUserCompletedLessons = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body._id);
  const completedLessonId = req.body.id;

  if (user) {
    if (!user.completedLessons.includes(completedLessonId)) {
      user.completedLessons.push(completedLessonId);
      await user.save();
    }
    
    res.status(200).json({ message: "Completed successfully" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});


// @desc  Fetch the given user completed lessons
// @route POST /api/users/fetch/given/user/completed/lessons
const fetchGivenUserCompletedLessons = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body._id);

  if (user) {
    const completedLessons = user.completedLessons || [];

    res.status(200).json({completedLessons});
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});


// @desc  Calculate and send the user progress percentage 
// @route POST /api/users/get/user/progress/percentage
const calculateAndSendUserProgressPercentage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body._id);

  if (user) {
    const totalLessons = 166;
    const completedLessons = user.completedLessons.length;

    const completionPercentage = (completedLessons / totalLessons) * 100;

    res.json({ completionPercentage });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});



export {
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
};
