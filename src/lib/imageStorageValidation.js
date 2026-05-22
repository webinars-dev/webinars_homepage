const LEGACY_IMAGE_REFERENCE_PATTERN =
  /data:image\/|(?:https?:)?\/\/webinars\.co\.kr\/wp-content\/uploads\/|(?:^|["'(\s])\/?wp-content\/uploads\//i;

export function hasLegacyImageReference(value) {
  return LEGACY_IMAGE_REFERENCE_PATTERN.test(String(value || ''));
}

export function assertNoLegacyImageReferences(fields, context = '콘텐츠') {
  for (const [field, value] of Object.entries(fields || {})) {
    if (!hasLegacyImageReference(value)) continue;
    throw new Error(
      `${context}의 ${field}에 legacy 이미지 참조가 포함되어 있습니다. 이미지 업로드를 사용해 Supabase Storage URL로 저장해주세요.`
    );
  }
}
