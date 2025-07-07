import mongoose from "mongoose";

// Example Mongoose models (replace with your actual model imports)
const User = mongoose.model("User");
// const UsersGroups = mongoose.model("GroupUser");
const Group = mongoose.model("Group");


// Returns true if user is in a group named "administrator"
export async function isAdmin(email: string): Promise<boolean> {
  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user) return false;

  // 2. Find user groups and check if any group is named "administrator"
  const isAdmin = await Group.exists({
    memberIDs: user._id,
    name: "Administrators",
    active: true,
    deleted: false,
  });
  
  return !!isAdmin;
}