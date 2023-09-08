export enum ConfirmResult {
    Ok,
    Cancel,
    Yes,
    No,
}
export enum ConfirmBtnPattern {
    OkCancel,
    OkOnly,
    YesNo,
}
export type ConfirmParam = {
    message: string;
    title?: string;
    btnPattern?: ConfirmBtnPattern;
}
