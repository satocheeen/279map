import { GraphQLError } from 'graphql';
import { ErrorType } from '../../279map-api-interface/dist';

type Param = {
    type: ErrorType;
    message: string;
}
export class CustomError extends GraphQLError {
    constructor({ type, message }: Param) {
        super(message, undefined, undefined, undefined, undefined, undefined, {
            type,
        });
    }
}
