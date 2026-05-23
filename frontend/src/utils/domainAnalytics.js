/**
 * @param {Array} skills
 * @returns {{
 *  domains: Array<{ domain: string, totalSkills: number, completedSkills: number, percentageCompletion: number }>,
 *  strongestDomain: string|null,
 *  weakestDomain: string|null
 * }}
 */
export function calculateSkillStrength(skills) {
  const list = Array.isArray(skills) ? skills : [];
  const domainMap = new Map();

  for (const skill of list) {
    const domain = String(skill?.domain || 'General');
    if (!domainMap.has(domain)) {
      domainMap.set(domain, { domain, totalSkills: 0, completedSkills: 0, percentageCompletion: 0 });
    }
    const item = domainMap.get(domain);
    item.totalSkills += 1;
    if (skill?.completed) item.completedSkills += 1;
  }

  const domains = Array.from(domainMap.values()).map((item) => ({
    ...item,
    percentageCompletion: item.totalSkills === 0
      ? 0
      : Math.round((item.completedSkills / item.totalSkills) * 100)
  }));

  if (domains.length === 0) {
    return { domains: [], strongestDomain: null, weakestDomain: null };
  }

  const strongest = [...domains].sort((a, b) =>
    b.percentageCompletion - a.percentageCompletion || b.completedSkills - a.completedSkills
  )[0];

  const weakest = [...domains].sort((a, b) =>
    a.percentageCompletion - b.percentageCompletion || a.completedSkills - b.completedSkills
  )[0];

  return {
    domains,
    strongestDomain: strongest?.domain || null,
    weakestDomain: weakest?.domain || null
  };
}
