import User from '../models/User.model'

export const getAllUsers = async () => {
  return await User.find({ active: true }).sort({ createdAt: -1 });
};

export const getUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

export const createUser = async (userData: { username: string; email: string; active: boolean }) => {
  const user = new User(userData);
  return await user.save();
};