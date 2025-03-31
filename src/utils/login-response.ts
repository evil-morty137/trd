import jwt from 'jsonwebtoken';
import User from '../models/user.model';

export const loginResponse = async (userId: string) => {
    const user = await User.findOne({ _id: userId })

    const accessToken = genetateAccessToken({ userId });

    return {
        user,
        accessToken
    }
}

export const genetateAccessToken = (payload: { userId: string }) => {
    const { userId } = payload;
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, { algorithm: 'HS256', expiresIn: '24h', issuer: 'application' })

    return accessToken
}