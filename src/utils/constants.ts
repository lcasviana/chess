import type { Accessor } from "solid-js";

export const truthy: Accessor<true> = (): true => true;
export const falsy: Accessor<false> = (): false => false;
