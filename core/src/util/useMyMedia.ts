import { useMedia } from "react-use";

export default function useMyMedia() {
    const isPC = useMedia("(min-width: 600px)");

    return {
        isPC,
    }
}