import type { Attachment } from "svelte/attachments";

import type { MewaBehavior } from '../../runtime/behavior.js';
export type { MewaBehavior } from '../../runtime/behavior.js';

export declare function mewa<State = unknown, Options = unknown>(
  behavior: MewaBehavior<State, Options>,
  options?: Options
): Attachment<HTMLElement>;

export { mewa as attachBehavior };
