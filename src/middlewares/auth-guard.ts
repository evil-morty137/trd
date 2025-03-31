import { expressjwt } from "express-jwt";

export const jwtGuard = (params: { credentialsRequired: boolean }) => expressjwt({
    secret: process.env.JWT_SECRET as string,
    algorithms: ['HS256'],
    credentialsRequired: params.credentialsRequired,
});