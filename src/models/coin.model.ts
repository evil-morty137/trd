import { Schema, model } from 'mongoose';

export interface ICoin {
    name: string,
    balance: string,
    userId: string
}
const coinSchema = new Schema<ICoin>({
   name: {type: String},
   balance: {type: String},
   userId: {type: String},
})

const Coin  = model<ICoin>('Coin', coinSchema);
export default Coin 