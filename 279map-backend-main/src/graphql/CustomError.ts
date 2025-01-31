import { GraphQLError } from 'graphql';
import { ConnectErrorType } from './__generated__/types';

type Param = {
    type: ConnectErrorType;
    message: string;
    userId?: string;
}
export class CustomError extends GraphQLError {
    type: ConnectErrorType;
    
    constructor({ type, message, userId }: Param) {
        super(message, {
            extensions: {
                type,
                userId,
            }
        });
        this.type = type;
    }
}
