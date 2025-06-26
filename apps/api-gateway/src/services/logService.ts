import { ILog, Log } from "../models/Log.model";

export const getAllLogs = async () => {
  return await Log.find().sort({ createdAt: -1 });
};

export const getNewLogs = async (since: Date): Promise<ILog[]> => {
  return await Log.find({ date: { $gt: since } }).sort({ date: 1 });
};