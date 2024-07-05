export enum FeatureColor {
    Error,      // エラー時
    Selected,   // 選択時
}
export const ColorPattern = {
    [FeatureColor.Error]: '#ff8888',
    [FeatureColor.Selected]: '#b2438b',
};
