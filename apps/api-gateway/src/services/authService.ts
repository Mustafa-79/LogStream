import mongoose from "mongoose";

// Example Mongoose models (replace with your actual model imports)
const User = mongoose.model("User");
const UsersGroups = mongoose.model("GroupUser");
const Group = mongoose.model("Group");


// Returns true if user is in a group named "administrator"
export async function isAdmin(email: string): Promise<boolean> {
  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user) return false;

  // 2. Find group IDs for this user
  const userGroups = await UsersGroups.find({ userId: user._id, active: true });
  const groupIds = userGroups.map((ug: any) => ug.groupId);

  if (groupIds.length === 0) return false;

  // 3. Check if any group has name "administrator"
  const adminGroup = await Group.findOne({ _id: { $in: groupIds }, name: "Administrators", active: true });
  return !!adminGroup;
}