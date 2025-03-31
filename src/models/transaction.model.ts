import { Schema, model } from 'mongoose';

export interface ITransaction {
    type: string,
    coin: string,
    status: string,
    amount: number,
    address: string,
    createdAt: Date,
    userId: string
}
const transactionSchema = new Schema<ITransaction>({
    type: { type: String },
    coin: { type: String },
    status: { type: String },
    amount: { type: Number },
    address: { type: String },
    userId: { type: String },
    createdAt: { type: Date, default: Date.now }
})

const Transaction = model<ITransaction>('Transaction', transactionSchema);
export default Transaction