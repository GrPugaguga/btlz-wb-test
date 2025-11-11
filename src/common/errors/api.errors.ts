import { WbApiErrorResponse } from '#common/types/wb.types.js';

export class ApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

export class WbApiError extends ApiError {
    constructor(message: string, public readonly statusCode?: number, public readonly details?: WbApiErrorResponse | any) {
        super(message);
        this.name = 'WbApiError';
    }
}
