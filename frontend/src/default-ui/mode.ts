import type{InterfaceDesign}from'../../../contracts/src';
/** Older saved default designs explicitly used the warm surface; retain it. New defaults declare Dark. */
export const defaultMode=(design:InterfaceDesign):'dark'|'light'=>design.defaultMode||'light';
