import mongoose from "mongoose";

// Example Mongoose models (replace with your actual model imports)
const User = mongoose.model("User");
const UsersGroups = mongoose.model("GroupUser");
const Group = mongoose.model("Group");


// Returns true if user is in a group named "administrator"
export async function isAdmin(email: string): Promise<{ isAdmin: boolean; userId: mongoose.Types.ObjectId | null }> {
  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user) return { isAdmin: false, userId: null };

  // 2. Find group IDs for this user
  const userGroups = await UsersGroups.find({ userId: user._id, active: true });
  const groupIds = userGroups.map((ug: any) => ug.groupId);

  if (groupIds.length === 0) return { isAdmin: false, userId: user._id };

  // 3. Check if any group has name "administrator"
  const adminGroup = await Group.findOne({ _id: { $in: groupIds }, name: "Administrators", active: true });
  return { isAdmin: !!adminGroup, userId: user._id };
}
