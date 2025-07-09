import mongoose from "mongoose";
import { ILog, Log } from "../models/Log.model";
import Group from '../models/Group.model';

interface LogFilters {
  applications?: string[];
  logLevels?: string[];
  fromDate?: Date;
  toDate?: Date;
}

export const getNewLogs = async (since: Date): Promise<ILog[]> => {
  return await Log.find({ date: { $gt: since } }).sort({ date: 1 });
};

export const getLogs = async (
  userId: string, 
  since: Date,
  page: number = 1,
  limit: number = 25,
  filters?: LogFilters
): Promise<{
  logs: ILog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;
    
    console.log('Fetching logs for user:', userId, 'Since:', since, 'Page:', page, 'Limit:', limit);
    console.log('Applied filters:', filters);
    
    // Build date filter conditions
    const dateConditions: any[] = [
      { $in: ["$sourceApp", "$$appIds"] },
      { $gt: ["$date", since] }
    ];
    
    // Add fromDate filter if provided
    if (filters?.fromDate) {
      dateConditions.push({ $gte: ["$date", filters.fromDate] });
    }
    
    // Add toDate filter if provided
    if (filters?.toDate) {
      dateConditions.push({ $lte: ["$date", filters.toDate] });
    }
    
    const result = await Group.aggregate([
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
                  $and: dateConditions
                }
              }
            },
            {
              $sort: { date: -1 }
            },
            // Stage 5: Lookup application details to get application name
            {
              $lookup: {
                from: "applications",
                localField: "sourceApp",
                foreignField: "_id",
                as: "applicationDetails"
              }
            },
            // Stage 6: Add application name field and clean up
            {
              $addFields: {
                sourceAppName: {
                  $ifNull: [
                    { $arrayElemAt: ["$applicationDetails.name", 0] },
                    "Unknown Application"
                  ]
                },
                sourceAppId: "$sourceApp"
              }
            },
            // Stage 7: Apply application ID filter if provided
            ...(filters?.applications && filters.applications.length > 0 ? [{
              $match: {
                sourceApp: { $in: filters.applications.map(id => new mongoose.Types.ObjectId(id)) }
              }
            }] : []),
            // Stage 8: Apply log level filter if provided
            ...(filters?.logLevels && filters.logLevels.length > 0 ? [{
              $match: {
                logLevel: { $in: filters.logLevels }
              }
            }] : []),
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
              }
            }
          ],
          as: "logs"
        }
      },
      // Stage 5: Use $facet to get both paginated data and total count
      {
        $facet: {
          data: [
            { $unwind: "$logs" },
            { $replaceRoot: { newRoot: "$logs" } },
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $unwind: "$logs" },
            { $count: "count" }
          ]
        }
      }
    ]);
    
    const logs = result[0]?.data || [];
    console.log('Logs fetched for user:', userId, 'Count:', logs.length);
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    console.log('Total logs count:', totalCount);
    const totalPages = Math.ceil(totalCount / limit);
    console.log('Total pages:', totalPages);
    
    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit
    };
    
    return {
      logs: logs as ILog[],
      pagination
    };
    
  } catch (error) {
    console.error('Error fetching logs for user with aggregation:', error);
    throw error;
  }
};

export const getLogStats = async (
  userId: string, 
): Promise<{
  totalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  debugCount: number;
}> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const result = await Group.aggregate([
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
                  ]
                }
              }
            }
          ],
          as: "logs"
        }
      },
      // Stage 5: Use $facet to get total count and counts by log level
      {
        $facet: {
          totalCount: [
            { $unwind: "$logs" },
            { $count: "count" }
          ],
          logLevelCounts: [
            { $unwind: "$logs" },
            {
              $group: {
                _id: { $toLower: "$logs.logLevel" },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);
    
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const logLevelCounts = result[0]?.logLevelCounts || [];
    
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let debugCount = 0;
    
    logLevelCounts.forEach((levelCount: { _id: string; count: number }) => {
      const logLevel = levelCount._id.toLowerCase();
      const count = levelCount.count;
      
      switch (logLevel) {
        case 'error':
          errorCount = count;
          break;
        case 'warning':
          warningCount += count;
          break;
        case 'info':
          infoCount += count;
          break;
        case 'debug':
          debugCount += count;
          break;
        default:
          infoCount += count;
          break;
      }
    });
    
    const stats = {
      totalCount,
      errorCount,
      warningCount,
      infoCount,
      debugCount
    };
    
    
    return stats;
  } catch (error) {
    console.error('Error fetching log stats for user:', error);
    throw error;
  }
};