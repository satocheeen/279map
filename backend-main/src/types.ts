import { ItemDefine } from "./graphql/__generated__/types";
import { MapKind } from "./types-common/common-types";

export enum AuthMethod {
    None = "None",
    Auth0 = "Auth0",
    Original = "Original",
}

export type ItemDefineWithoutContents = Omit<ItemDefine, 'contents'> & {
    mapKind: MapKind;
};
