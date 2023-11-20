/**
 * get category
 */
export type GetCategoryParam = {
    dataSourceIds?: string[];   // 指定されている場合、指定のデータソースのイベントのみ返す
}
export type GetCategoryResult = {
    name: string;
    color: string;
    dataSourceIds: string[];
}[];
