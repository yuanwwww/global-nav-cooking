/** L1 / L2 / L3 entry types used in the add modal and right rail */
export const NAV_TYPE_PLAIN_TEXT = "plain-text";

/** Types that have an optional/required link URL; plain text is label-only. */
export function isNavTypeWithLink(navType) {
  return Boolean(navType) && navType !== NAV_TYPE_PLAIN_TEXT;
}
