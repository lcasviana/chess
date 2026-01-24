import type { Accessor } from "solid-js";

// Re-export shared constants
export { CENTER_SQUARES, PIECE_VALUES } from "@chess/shared";

// SolidJS-specific utilities (cannot be shared - framework-specific)
export const truthy: Accessor<true> = (): true => true;
export const falsy: Accessor<false> = (): false => false;
