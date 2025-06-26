import { Log } from "../models/Log.model";

export const getAllLogs = async () => {
  return await Log.find().sort({ createdAt: -1 });
};