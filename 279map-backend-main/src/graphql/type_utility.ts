import { MutationResolvers, QueryResolvers, Subscription } from "./__generated__/types";

type Members<T> = {
  [K in keyof T]: K;
}[keyof T];

type GetReturnType<Type> = Type extends (...args: never[]) => infer Return
  ? Return
  : never;

type AllQueryResolvers = Required<QueryResolvers>;
export type QResolvers = Members<AllQueryResolvers>;
export type QueryResolverReturnType<R extends QResolvers> = Promise<GetReturnType<AllQueryResolvers[R]>>;

type AllMutationResolvers = Required<MutationResolvers>;
export type MResolvers = Members<AllMutationResolvers>;
export type MutationResolverReturnType<R extends MResolvers> = Promise<GetReturnType<AllMutationResolvers[R]>>;

export type Resolvers = QResolvers | MResolvers | keyof Subscription;
