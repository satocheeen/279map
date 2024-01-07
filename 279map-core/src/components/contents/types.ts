export type ContentAttr = {
    title: string;
    overview: string;
    categories: string[];
} & ({
    type: 'normal';
    date?: string;
    imageUrl?: string;
    url?: string;
} | {
    type: 'sns';
    url?: string;
});
