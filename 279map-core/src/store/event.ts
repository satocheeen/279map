import { atom } from 'jotai';
import { loadable } from "jotai/utils";
import { visibleDataSourceIdsAtom } from "./datasource";
import { atomWithQuery } from "jotai-urql";
import { GetEventDocument } from "../graphql/generated/graphql";

const getEventQueryAtom = atomWithQuery({
    query: GetEventDocument,
    getVariables: (get) => {
        const targetDataSourceIds = get(visibleDataSourceIdsAtom);
        return {
            dataSourceIds: targetDataSourceIds,
        }
    }
})
const eventsAtom = atom(async(get) => {
    const getEventQuery = await get(getEventQueryAtom);
    return getEventQuery.data?.getEvent ?? [];
})

export const eventsLoadableAtom = loadable(eventsAtom);