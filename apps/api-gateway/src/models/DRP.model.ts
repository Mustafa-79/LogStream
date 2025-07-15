import mongoose, { Schema, Document } from 'mongoose';

export interface IDRP extends Document {
    _id: mongoose.Types.ObjectId;
    dataRetentionPeriod: number; // in days
    createdAt: Date;
    updatedAt: Date;
}

const DRPSchema: Schema = new Schema({
    dataRetentionPeriod: {
        type: Number,
        required: true,
        default: 30 // default to 30 days
    }
}, {
    timestamps: true
});

export default mongoose.model<IDRP>('DRP', DRPSchema, 'drp');
