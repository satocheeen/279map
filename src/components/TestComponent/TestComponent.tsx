import React, { useRef } from 'react';

export interface TestComponentProps {
    label: string;
}

export default function TestComponent(props: TestComponentProps) {
    const testRef = useRef(1);
    return (
        <div>
            <p>Version {testRef.current}</p>
            <p>{props.label}</p>
        </div>
    )
}
