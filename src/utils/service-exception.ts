export abstract class ServiceException extends Error {
    public code: number;
    public details?: any;

    constructor(message: string, code: number) {
        super(message);
        this.message = message;
        this.code = code;
    }
}
export class BadRequestException extends ServiceException {
    constructor(message: string) {
        super(message, 400);
    }

}


export class NotFoundException extends ServiceException {
    constructor(message: string) {
        super(message, 404);
    }
}