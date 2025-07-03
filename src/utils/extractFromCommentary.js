import cricketSynonyms from './cricket_synonyms.json';
import exclusionMap from './exclusion_map.json';

export function extractFieldsFromCommentary(commText) {
  const text = commText?.toLowerCase() || "";

  // Helper to check for exclusions
  function isExcluded(category, key, text) {
    const exclusions = exclusionMap[category]?.[key] || [];
    return exclusions.some(ex => text.includes(ex));
  }

  // Generic extractor
  function extractField(category) {
    const synonymMap = cricketSynonyms[category] || {};
    for (const key in synonymMap) {
      // Exclusion check
      if (isExcluded(category, key, text)) continue;
      if (synonymMap[key].some(syn => text.includes(syn))) {
        return key;
      }
    }
    return undefined;
  }

  return {
    ballType: extractField('ballType'),
    direction: extractField('direction'),
    shotType: extractField('shotType'),
    connection: extractField('connection'),
    keeperCatch: extractField('keeperCatch'),
  };
}