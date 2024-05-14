import { ItemDefine } from "./graphql/__generated__/types";

export enum AuthMethod {
    None = "None",
    Auth0 = "Auth0",
    Original = "Original",
}

export type ItemDefineWithoudContents = Omit<ItemDefine, 'contents' | 'linkedContents'>;
