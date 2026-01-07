// Content Guidelines Generator
// Converts family preferences into story/image generation guidelines

import { type LanguageCode } from '@/lib/translation';

export interface FamilyPreferences {
  cultural_background?: string[];
  religious_tradition?: string;
  religious_observance_level?: 'secular' | 'cultural' | 'observant' | 'strict';
  dietary_preferences?: string[];
  celebrate_religious_holidays?: boolean;
  celebrate_secular_holidays?: boolean;
  specific_holidays?: string[];
  excluded_holidays?: string[];
  allow_magic_fantasy?: boolean;
  allow_mythology?: 'all' | 'own-culture' | 'none';
  allow_talking_animals?: boolean;
  allow_supernatural_elements?: boolean;
  family_structure?: string;
  custom_family_notes?: string;
  gender_representation?: 'balanced' | 'traditional' | 'neutral';
  conflict_level?: 'none' | 'mild' | 'moderate';
  allow_mild_peril?: boolean;
  include_educational_content?: boolean;
  educational_focus?: string[];
  modesty_level?: 'standard' | 'modest' | 'very-modest';
  allow_music_themes?: boolean;
  allow_dance_themes?: boolean;
  excluded_themes?: string[];
  excluded_elements?: string[];
  custom_guidelines?: string;
}

export interface ChildPreferences {
  use_family_defaults?: boolean;
  allow_magic_fantasy?: boolean;
  allow_scary_elements?: boolean;
  conflict_level?: string;
  avoid_themes?: string[];
  favorite_themes?: string[];
  needs_simple_language?: boolean;
  needs_high_contrast_images?: boolean;
}

export interface ContentGuidelines {
  storyGuidelines: string;
  imageGuidelines: string;
  excludedElements: string[];
  includedElements: string[];
  toneGuidelines: string;
}

// Religious and cultural content guidelines
const RELIGIOUS_GUIDELINES: Record<string, {
  observant: { include: string[]; exclude: string[]; notes: string };
  strict: { include: string[]; exclude: string[]; notes: string };
}> = {
  christian: {
    observant: {
      include: ['faith themes', 'prayer', 'kindness', 'forgiveness', 'helping others', 'Christmas', 'Easter'],
      exclude: ['occult practices', 'dark magic'],
      notes: 'May include gentle faith-based themes and Christian holidays'
    },
    strict: {
      include: ['Biblical values', 'faith', 'prayer', 'church community', 'Christian holidays'],
      exclude: ['magic', 'witches', 'wizards', 'sorcery', 'Halloween', 'occult', 'eastern mysticism', 'evolution themes'],
      notes: 'Focus on faith-based values, avoid all magical/supernatural elements outside Biblical context'
    }
  },
  muslim: {
    observant: {
      include: ['Islamic values', 'kindness', 'charity', 'family respect', 'Eid celebrations', 'Ramadan themes'],
      exclude: ['pork/pig characters', 'alcohol references', 'immodest dress'],
      notes: 'Include Islamic celebrations, modest dress, halal-friendly content'
    },
    strict: {
      include: ['Islamic teachings', 'Prophet stories (respectfully)', 'mosque', 'prayer', 'Quran values', 'Eid', 'Ramadan'],
      exclude: ['magic', 'sorcery', 'pigs', 'dogs as pets inside homes', 'alcohol', 'music instruments', 'dancing', 'immodest clothing', 'cross-gender friendships'],
      notes: 'Strictly Islamic content, modest dress, gender-appropriate interactions, no music/dance, no magical elements'
    }
  },
  jewish: {
    observant: {
      include: ['Jewish values', 'Shabbat', 'Jewish holidays', 'tikun olam', 'family traditions', 'Hebrew elements'],
      exclude: ['non-kosher food prominently featured', 'Christmas as religious'],
      notes: 'Include Jewish celebrations and values, kosher-friendly content'
    },
    strict: {
      include: ['Torah values', 'Shabbat observance', 'Jewish holidays', 'mitzvot', 'synagogue', 'kosher lifestyle'],
      exclude: ['non-kosher animals as food', 'Shabbat violations', 'mixing meat/dairy', 'immodest dress'],
      notes: 'Orthodox-friendly content, strict Shabbat respect, tzniut (modesty) standards'
    }
  },
  hindu: {
    observant: {
      include: ['Hindu values', 'Diwali', 'Holi', 'dharma', 'karma', 'respect for elders', 'vegetarian-friendly'],
      exclude: ['beef/cow as food', 'disrespect to deities'],
      notes: 'Include Hindu festivals and values, vegetarian-friendly, respect for sacred animals'
    },
    strict: {
      include: ['Hindu deities (respectfully)', 'Sanskrit elements', 'puja', 'temples', 'vegetarian lifestyle', 'ahimsa'],
      exclude: ['beef', 'meat prominently featured', 'leather items', 'onion/garlic for some'],
      notes: 'Strictly vegetarian content, respectful deity representation, traditional values'
    }
  },
  buddhist: {
    observant: {
      include: ['Buddhist values', 'compassion', 'mindfulness', 'karma', 'nature respect', 'meditation'],
      exclude: ['violence glorification', 'cruelty to animals'],
      notes: 'Peaceful themes, respect for all living beings, mindfulness elements'
    },
    strict: {
      include: ['Buddhist teachings', 'temples', 'monks', 'meditation', 'Vesak', 'non-violence', 'vegetarian'],
      exclude: ['killing/hunting', 'meat', 'alcohol', 'violence of any kind'],
      notes: 'Strictly peaceful, vegetarian, no violence even in conflict resolution'
    }
  },
  sikh: {
    observant: {
      include: ['Sikh values', 'seva (service)', 'equality', 'langar (community meals)', 'Gurdwara', 'Vaisakhi'],
      exclude: ['tobacco', 'alcohol', 'disrespect to turbans/hair'],
      notes: 'Include Sikh traditions, equality themes, community service'
    },
    strict: {
      include: ['Guru teachings', 'five Ks respect', 'Gurdwara', 'equality', 'vegetarian for many', 'Punjabi elements'],
      exclude: ['tobacco', 'alcohol', 'halal/kosher meat', 'cutting hair themes', 'caste references'],
      notes: 'Strict adherence to Sikh principles, vegetarian-friendly, equality emphasized'
    }
  }
};

// Cultural background specific elements
const CULTURAL_ELEMENTS: Record<string, { include: string[]; considerations: string[] }> = {
  'east-asian': {
    include: ['respect for elders', 'education value', 'family harmony', 'tea culture', 'lunar new year'],
    considerations: ['hierarchical family relationships', 'collective over individual', 'indirect communication styles']
  },
  'south-asian': {
    include: ['extended family', 'festivals of color and light', 'hospitality', 'diverse traditions'],
    considerations: ['family honor', 'respect for elders', 'arranged relationships neutral', 'regional diversity']
  },
  'middle-eastern': {
    include: ['hospitality', 'family bonds', 'desert and oasis imagery', 'geometric art'],
    considerations: ['gender interactions', 'modesty norms', 'religious diversity in region']
  },
  'african': {
    include: ['community (ubuntu)', 'oral traditions', 'extended family', 'nature connection', 'diverse cultures'],
    considerations: ['avoid monolithic portrayal', 'celebrate diversity', 'avoid stereotypes']
  },
  'latin-american': {
    include: ['extended family', 'celebrations', 'vibrant culture', 'Day of the Dead (respectfully)', 'diverse heritage'],
    considerations: ['religious traditions vary', 'indigenous heritage respect', 'regional diversity']
  },
  'european': {
    include: ['diverse traditions', 'fairy tale heritage', 'seasonal celebrations'],
    considerations: ['religious diversity', 'avoid stereotypes', 'regional differences']
  },
  'indigenous': {
    include: ['nature connection', 'oral traditions', 'community elders', 'respect for land'],
    considerations: ['avoid appropriation', 'authentic representation', 'tribal diversity', 'consult authentic sources']
  }
};

// Modesty guidelines for image generation
const MODESTY_GUIDELINES: Record<string, string> = {
  standard: 'Age-appropriate clothing, casual modern dress acceptable',
  modest: 'Conservative clothing, shoulders and knees covered, no tight/revealing clothing',
  'very-modest': 'Very conservative dress, loose fitting clothes, full coverage, head coverings where culturally appropriate'
};

export function generateContentGuidelines(
  familyPrefs: FamilyPreferences,
  childPrefs?: ChildPreferences,
  childAge?: number,
  language?: LanguageCode
): ContentGuidelines {
  const excludedElements: string[] = [...(familyPrefs.excluded_elements || [])];
  const includedElements: string[] = [];
  const storyNotes: string[] = [];
  const imageNotes: string[] = [];

  // Apply child-specific preferences if not using family defaults
  const useChildOverrides = childPrefs && !childPrefs.use_family_defaults;
  
  // Religious guidelines
  if (familyPrefs.religious_tradition && familyPrefs.religious_tradition !== 'none') {
    const religion = familyPrefs.religious_tradition;
    const level = familyPrefs.religious_observance_level || 'secular';
    
    if (level === 'observant' || level === 'strict') {
      const guidelines = RELIGIOUS_GUIDELINES[religion]?.[level as 'observant' | 'strict'];
      if (guidelines) {
        includedElements.push(...guidelines.include);
        excludedElements.push(...guidelines.exclude);
        storyNotes.push(guidelines.notes);
      }
    }
  }

  // Cultural background
  if (familyPrefs.cultural_background?.length) {
    for (const culture of familyPrefs.cultural_background) {
      const elements = CULTURAL_ELEMENTS[culture];
      if (elements) {
        includedElements.push(...elements.include);
        storyNotes.push(`Cultural considerations: ${elements.considerations.join(', ')}`);
      }
    }
  }

  // Magic and fantasy
  const allowMagic = useChildOverrides ? childPrefs?.allow_magic_fantasy : familyPrefs.allow_magic_fantasy;
  if (allowMagic === false) {
    excludedElements.push('magic', 'spells', 'witches', 'wizards', 'sorcery', 'enchantments', 'magical powers');
    storyNotes.push('No magical or fantasy elements - keep stories grounded in reality');
  }

  // Mythology
  if (familyPrefs.allow_mythology === 'none') {
    excludedElements.push('mythology', 'Greek gods', 'Norse gods', 'mythical creatures');
  } else if (familyPrefs.allow_mythology === 'own-culture') {
    storyNotes.push('Only include mythology from the family\'s own cultural background');
  }

  // Talking animals
  if (familyPrefs.allow_talking_animals === false) {
    excludedElements.push('talking animals', 'anthropomorphic animals');
    storyNotes.push('Animals should behave realistically, not talk or act human');
  }

  // Supernatural elements
  if (familyPrefs.allow_supernatural_elements === false) {
    excludedElements.push('ghosts', 'spirits', 'supernatural', 'paranormal', 'angels', 'demons');
  }

  // Dietary preferences (for food shown in stories)
  if (familyPrefs.dietary_preferences?.length) {
    for (const diet of familyPrefs.dietary_preferences) {
      switch (diet) {
        case 'halal':
          excludedElements.push('pork', 'pig characters', 'bacon', 'ham', 'alcohol');
          storyNotes.push('Food shown should be halal-appropriate');
          break;
        case 'kosher':
          excludedElements.push('pork', 'shellfish', 'mixing meat and dairy');
          storyNotes.push('Food shown should be kosher-appropriate');
          break;
        case 'vegetarian':
          excludedElements.push('meat dishes prominently featured', 'hunting for food');
          storyNotes.push('Prefer vegetarian food in meal scenes');
          break;
        case 'vegan':
          excludedElements.push('meat', 'dairy', 'eggs prominently featured');
          storyNotes.push('Prefer plant-based food in scenes');
          break;
        case 'no-pork':
          excludedElements.push('pork', 'pig characters as food', 'bacon', 'ham');
          break;
      }
    }
  }

  // Holiday preferences
  if (familyPrefs.excluded_holidays?.length) {
    excludedElements.push(...familyPrefs.excluded_holidays.map(h => `${h} themes`));
  }
  if (familyPrefs.specific_holidays?.length) {
    includedElements.push(...familyPrefs.specific_holidays.map(h => `${h} celebrations`));
  }

  // Family structure
  if (familyPrefs.family_structure === 'traditional') {
    storyNotes.push('Show traditional two-parent family structures');
  } else if (familyPrefs.family_structure === 'custom' && familyPrefs.custom_family_notes) {
    storyNotes.push(`Family representation: ${familyPrefs.custom_family_notes}`);
  }

  // Gender representation
  if (familyPrefs.gender_representation === 'traditional') {
    storyNotes.push('Traditional gender roles in character depiction');
  } else if (familyPrefs.gender_representation === 'neutral') {
    storyNotes.push('Gender-neutral language and roles where possible');
  }

  // Conflict level
  const conflictLevel = useChildOverrides ? childPrefs?.conflict_level : familyPrefs.conflict_level;
  if (conflictLevel === 'none') {
    excludedElements.push('conflict', 'villains', 'antagonists', 'fighting', 'arguments');
    storyNotes.push('No conflict - purely positive, harmonious stories');
  } else if (conflictLevel === 'mild') {
    storyNotes.push('Only mild, age-appropriate conflict resolved peacefully');
  }

  // Peril
  if (familyPrefs.allow_mild_peril === false) {
    excludedElements.push('danger', 'peril', 'scary situations', 'getting lost', 'storms');
  }

  // Music and dance
  if (familyPrefs.allow_music_themes === false) {
    excludedElements.push('musical instruments', 'singing performances', 'concerts');
  }
  if (familyPrefs.allow_dance_themes === false) {
    excludedElements.push('dancing', 'dance parties', 'ballet');
  }

  // Modesty for images
  const modestyGuideline = MODESTY_GUIDELINES[familyPrefs.modesty_level || 'standard'];
  imageNotes.push(`Dress code: ${modestyGuideline}`);

  // Educational focus
  if (familyPrefs.include_educational_content && familyPrefs.educational_focus?.length) {
    includedElements.push(...familyPrefs.educational_focus.map(f => `${f} learning elements`));
  }

  // Child-specific avoidances
  if (childPrefs?.avoid_themes?.length) {
    excludedElements.push(...childPrefs.avoid_themes);
    storyNotes.push(`Child-specific sensitivities: avoid ${childPrefs.avoid_themes.join(', ')}`);
  }

  // Child-specific favorites
  if (childPrefs?.favorite_themes?.length) {
    includedElements.push(...childPrefs.favorite_themes);
  }

  // Accessibility
  if (childPrefs?.needs_simple_language) {
    storyNotes.push('Use simpler vocabulary and shorter sentences for accessibility');
  }
  if (childPrefs?.needs_high_contrast_images) {
    imageNotes.push('Use high contrast colors, clear outlines, avoid busy backgrounds');
  }

  // Custom exclusions
  if (familyPrefs.excluded_themes?.length) {
    excludedElements.push(...familyPrefs.excluded_themes);
  }

  // Custom guidelines
  if (familyPrefs.custom_guidelines) {
    storyNotes.push(`Custom family guidelines: ${familyPrefs.custom_guidelines}`);
  }

  // Build final guidelines
  const storyGuidelines = `
FAMILY CONTENT GUIDELINES:
${storyNotes.length > 0 ? storyNotes.map(n => `- ${n}`).join('\n') : '- Standard content guidelines apply'}

ELEMENTS TO INCLUDE:
${includedElements.length > 0 ? includedElements.map(e => `- ${e}`).join('\n') : '- No specific requirements'}

ELEMENTS TO EXCLUDE:
${excludedElements.length > 0 ? excludedElements.map(e => `- ${e}`).join('\n') : '- Standard exclusions only'}
`.trim();

  const imageGuidelines = `
IMAGE CONTENT GUIDELINES:
${imageNotes.map(n => `- ${n}`).join('\n')}

MUST NOT INCLUDE:
${excludedElements.filter(e => 
  ['pork', 'pig', 'alcohol', 'immodest', 'revealing', 'dancing', 'musical instruments'].some(term => 
    e.toLowerCase().includes(term)
  )
).map(e => `- ${e}`).join('\n') || '- Standard safety guidelines'}
`.trim();

  const toneGuidelines = familyPrefs.religious_observance_level === 'strict'
    ? 'Reverent, respectful, values-focused tone'
    : familyPrefs.religious_observance_level === 'observant'
    ? 'Warm, values-aware, culturally respectful tone'
    : 'Warm, inclusive, universally appropriate tone';

  return {
    storyGuidelines,
    imageGuidelines,
    excludedElements: [...new Set(excludedElements)],
    includedElements: [...new Set(includedElements)],
    toneGuidelines
  };
}

// Quick check functions for common restrictions
export function canIncludeMagic(prefs: FamilyPreferences): boolean {
  return prefs.allow_magic_fantasy !== false;
}

export function canIncludeTalkingAnimals(prefs: FamilyPreferences): boolean {
  return prefs.allow_talking_animals !== false;
}

export function getModestyLevel(prefs: FamilyPreferences): string {
  return prefs.modesty_level || 'standard';
}

export function getDietaryRestrictions(prefs: FamilyPreferences): string[] {
  return prefs.dietary_preferences || [];
}
