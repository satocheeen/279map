import { GraphQLError } from 'graphql';
import { ErrorType } from '../../279map-api-interface/dist';

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
