import User from '../models/User.model'

export const getAllUsers = async () => {
  return await User.find({ active: true }).sort({ createdAt: -1 });
};