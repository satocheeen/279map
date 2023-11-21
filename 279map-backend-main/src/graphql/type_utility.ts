import { QueryResolvers } from "./generated/types";

type Members<T> = {
  [K in keyof T]: K;
}[keyof T];

type AllQueryResolvers = Required<QueryResolvers>;
type Resolvers = Members<AllQueryResolvers>;

type GetReturnType<Type> = Type extends (...args: never[]) => infer Return
  ? Return
  : never;

export type ResolverReturnType<R extends Resolvers> = Promise<GetReturnType<AllQueryResolvers[R]>>;
