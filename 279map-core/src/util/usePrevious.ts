import { useEffect, useRef } from "react";

export function usePrevious<T>(value: T): T | null {
    const ref = useRef(null as any);
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
}
