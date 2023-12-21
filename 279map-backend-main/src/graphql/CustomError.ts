import { GraphQLError } from 'graphql';
import { ErrorType } from './__generated__/types';

type Param = {
    type: ErrorType;
    message: string;
    userId?: string;
}
export class CustomError extends GraphQLError {
    constructor({ type, message, userId }: Param) {
        super(message, {
            extensions: {
                type,
                userId,
            }
        })
    }
}
