/**
 * GDPR PII Detection Utility
 * Detects potential personally identifiable information in text
 */

interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: string[];
  confidence: 'high' | 'medium' | 'low';
}

// Common patterns for PII detection
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
  
  // European ID numbers (rough patterns)
  germanId: /\b\d{11}\b/g, // German tax ID
  
  // Credit card (basic Luhn check would be better)
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  
  // IBAN
  iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g,
  
  // Postal codes (various formats)
  postalCode: /\b\d{5}(?:[-\s]\d{4})?\b/g, // US ZIP
  
  // Date of birth patterns (DD.MM.YYYY, DD/MM/YYYY, etc.)
  dateOfBirth: /\b(0?[1-9]|[12][0-9]|3[01])[./-](0?[1-9]|1[0-2])[./-](19|20)\d{2}\b/g,
  
  // National insurance / social security
  socialSecurity: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
};

// Common name indicators (very basic heuristic)
const NAME_INDICATORS = [
  /\b(herr|frau|mr|mrs|ms|miss|dr|prof)\s+[A-Z][a-z]+/gi, // Titles + Name
  /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g, // Capitalized words (potential names)
];

// Address indicators
const ADDRESS_INDICATORS = [
  /\b\d+\s+[A-Z][a-z]+\s+(str|strasse|street|avenue|road|st|ave|rd)\b/gi,
  /\b(wohnhaft|wohnt|adresse|address|living at)\b/gi,
];

export function detectPII(text: string): PIIDetectionResult {
  const detectedTypes: string[] = [];
  let totalMatches = 0;

  // Check each PII pattern
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      detectedTypes.push(type);
      totalMatches += matches.length;
    }
  }

  // Check for name indicators
  let nameMatches = 0;
  for (const pattern of NAME_INDICATORS) {
    const matches = text.match(pattern);
    if (matches) {
      nameMatches += matches.length;
    }
  }
  if (nameMatches > 0) {
    detectedTypes.push('potential_name');
    totalMatches += nameMatches;
  }

  // Check for address indicators
  let addressMatches = 0;
  for (const pattern of ADDRESS_INDICATORS) {
    const matches = text.match(pattern);
    if (matches) {
      addressMatches += matches.length;
    }
  }
  if (addressMatches > 0) {
    detectedTypes.push('potential_address');
    totalMatches += addressMatches;
  }

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (totalMatches >= 3 || detectedTypes.includes('email') || detectedTypes.includes('phone')) {
    confidence = 'high';
  } else if (totalMatches >= 1) {
    confidence = 'medium';
  }

  return {
    hasPII: detectedTypes.length > 0,
    detectedTypes,
    confidence,
  };
}

export function getPIIWarningMessage(result: PIIDetectionResult): string {
  if (!result.hasPII) return '';

  const typesList = result.detectedTypes
    .map(type => type.replace(/_/g, ' '))
    .join(', ');

  return `⚠️ Potential personal data detected (${typesList}). Please ensure you only include necessary information for incident reporting. Avoid names, addresses, contact details, or identification numbers unless absolutely required.`;
}
