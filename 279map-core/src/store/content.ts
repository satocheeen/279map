import { atomWithMutation } from "jotai-urql";
import { UpdateContentDocument } from "../graphql/generated/graphql";

export const updateContentAtom = atomWithMutation(UpdateContentDocument);