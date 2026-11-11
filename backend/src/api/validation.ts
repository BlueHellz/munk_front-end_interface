// Only schema-known field names and fixed rules leave the validator. Never
// return/log AJV messages, data, paths or raw params, which may contain input.
const fields = new Set(['title','description','clientDraftId','uploadId','seriesName','episode','address','name','description','publicName','focus','version','introductionAssetId','faceVisible','publicConsent','purpose','size','kind','outcome','method','reason','id']);
type Issue = { instancePath?: string; keyword: string; params: Record<string, unknown> };
export function validationDetails(issues: Issue[]) {
  const fieldErrors: Record<string,string> = {};
  const diagnostics: {field:string;rule:string}[] = [];
  for (const issue of issues) {
    const candidate = issue.keyword==='additionalProperties'?issue.params.additionalProperty:issue.keyword==='required'?issue.params.missingProperty:issue.instancePath?.split('/')[1];
    const field = typeof candidate==='string'&&fields.has(candidate)?candidate:'_form';
    const rule = ['pattern','required','maxLength','minLength','type','enum','const','minimum','maximum','additionalProperties','format'].includes(issue.keyword)?issue.keyword:'invalid';
    diagnostics.push({field,rule});
    fieldErrors[field] = field==='address'&&rule==='pattern'?'Use 3–40 lowercase letters, numbers or hyphens; start and end with a letter or number. Example: mountain-studio.':rule==='additionalProperties'?'This field must not be sent in this request.':rule==='required'?'This field is required.':rule==='maxLength'?'This field exceeds its maximum length.':'Check this field’s format and allowed value.';
  }
  return {fieldErrors,diagnostics};
}
