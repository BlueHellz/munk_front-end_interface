import type { ReactNode, CSSProperties } from 'react';
import type { Theme } from './fixtures';
// Only components registered by application code can render. No user HTML/CSS/scripts.
export type SectionRegistry<K extends string> = Record<K, {
    label: string;
    render: () => ReactNode;
}>;
export function RegisteredSections<K extends string>({ order, registry, attribute = 'data-design-section' }: {
    order: readonly K[];
    registry: SectionRegistry<K>;
    attribute?: string;
}) { return <>{order.map(id => <div key={id} {...{ [attribute]: id }}>{registry[id].render()}</div>)}</>; }
export const designStyle = (design: Theme): CSSProperties => ({ '--columns': design.columns, '--house-columns': design.columns } as CSSProperties);
