import mongoose from "mongoose";
import { ILog, Log } from "../models/Log.model";
import Group from '../models/Group.model';

export const getNewLogs = async (since: Date): Promise<ILog[]> => {
  return await Log.find({ date: { $gt: since } }).sort({ date: 1 });
};

export const getNewLogsUser = async (userId: string, since: Date): Promise<ILog[]> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const logs = await Group.aggregate([
      // Stage 1: Find groups where user is a member
      {
        $match: {
          memberIDs: userObjectId,
          active: true,
          deleted: false
        }
      },
      // Stage 2: Unwind applicationIDs array to work with individual app IDs
      {
        $unwind: "$applicationIDs"
      },
      // Stage 3: Group by null to collect all unique application IDs
      {
        $group: {
          _id: null,
          applicationIds: { $addToSet: "$applicationIDs" }
        }
      },
      // Stage 4: Lookup logs from the Log collection
      {
        $lookup: {
          from: "logs",
          let: { appIds: "$applicationIds" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$sourceApp", "$$appIds"] },
                    { $gt: ["$date", since] }
                  ]
                }
              }
            },
            {
              $sort: { date: 1 }
            }
          ],
          as: "logs"
        }
      },
      // Stage 5: Unwind the logs array to get individual log documents
      {
        $unwind: "$logs"
      },
      // Stage 6: Replace the root with the log document
      {
        $replaceRoot: { newRoot: "$logs" }
      },
      // Stage 7: Lookup application details to get application name
      {
        $lookup: {
          from: "applications", // Assuming your applications collection is named "applications"
          localField: "sourceApp", // This contains the application ID
          foreignField: "_id",
          as: "applicationDetails"
        }
      },
      // Stage 8: Add application name field and clean up
      {
        $addFields: {
          sourceAppName: {
            $ifNull: [
              { $arrayElemAt: ["$applicationDetails.name", 0] },
              "Unknown Application"
            ]
          },
          sourceAppId: "$sourceApp" // Keep the original ID as well if needed
        }
      },
      // Stage 9: Replace sourceApp with the application name
      {
        $addFields: {
          sourceApp: "$sourceAppName"
        }
      },
      // Stage 10: Remove temporary fields
      {
        $project: {
          applicationDetails: 0,
          sourceAppName: 0
          // sourceAppId: 0 // Uncomment this if you don't want to keep the original ID
        }
      }
    ]);
    
    return logs as ILog[];
    
  } catch (error) {
    console.error('Error fetching logs for user with aggregation:', error);
    throw error;
  }
};

// Alternative version if you want to keep both ID and name separately
export const getNewLogsUserWithBothIdAndName = async (userId: string, since: Date): Promise<ILog[]> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const logs = await Group.aggregate([
      // Stages 1-6 are the same as above
      {
        $match: {
          memberIDs: userObjectId,
          active: true,
          deleted: false
        }
      },
      {
        $unwind: "$applicationIDs"
      },
      {
        $group: {
          _id: null,
          applicationIds: { $addToSet: "$applicationIDs" }
        }
      },
      {
        $lookup: {
          from: "logs",
          let: { appIds: "$applicationIds" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$sourceApp", "$$appIds"] },
                    { $gt: ["$date", since] }
                  ]
                }
              }
            },
            {
              $sort: { date: 1 }
            }
          ],
          as: "logs"
        }
      },
      {
        $unwind: "$logs"
      },
      {
        $replaceRoot: { newRoot: "$logs" }
      },
      // Stage 7: Lookup application details
      {
        $lookup: {
          from: "applications",
          localField: "sourceApp",
          foreignField: "_id",
          as: "applicationDetails"
        }
      },
      // Stage 8: Add both application ID and name as separate fields
      {
        $addFields: {
          sourceAppId: "$sourceApp",
          sourceAppName: {
            $ifNull: [
              { $arrayElemAt: ["$applicationDetails.name", 0] },
              "Unknown Application"
            ]
          }
        }
      },
      // Stage 9: Keep sourceApp as the name for backward compatibility
      {
        $addFields: {
          sourceApp: "$sourceAppName"
        }
      },
      // Stage 10: Clean up temporary fields
      {
        $project: {
          applicationDetails: 0,
          sourceAppName: 0
        }
      }
    ]);
    
    return logs as ILog[];
    
  } catch (error) {
    console.error('Error fetching logs for user with aggregation:', error);
    throw error;
  }
};