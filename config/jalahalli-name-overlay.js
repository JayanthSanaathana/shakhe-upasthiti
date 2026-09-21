/**
 * Jalahalli-only display overlay.
 *
 * Hierarchy links always come from live kdpEntities (ENTITY_REFERENCE_SOURCE=live).
 * When enabled, entity *names* under Jalahalli are replaced at display time with
 * whatever is stored for the same entity _id in the app DB (MONGO_URI) cache.
 *
 * Set enabled: false to turn off (one-nagara temporary fix).
 */
module.exports = {
  enabled: true,
  /** Match Nagara name in local entities (case-insensitive exact). */
  nagarName: 'JALAHALLI',
};
