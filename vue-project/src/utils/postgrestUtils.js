/**
 * PostgREST `.or()` 필터용 값 이스케이프.
 * `.or()` 문법에서 `, . : ( )` 는 예약문자이므로 값을 큰따옴표로 감싼다.
 * @see https://postgrest.org/en/stable/references/api/tables_views.html#horizontal-filtering
 * @param {string|number|null|undefined} raw
 * @returns {string} 예: `"%민이비(수원)%"`
 */
export function postgrestQuotedIlikePattern(raw) {
  const escaped = String(raw ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}

/**
 * 여러 컬럼에 대한 `.or()` ilike 필터 문자열 생성.
 * @param {string[]} fields
 * @param {string|number|null|undefined} raw
 * @returns {string} 예: `name.ilike."%foo%",business_registration_number.ilike."%foo%"`
 */
export function postgrestOrIlike(fields, raw) {
  const pattern = postgrestQuotedIlikePattern(raw);
  return fields.map((f) => `${f}.ilike.${pattern}`).join(',');
}
