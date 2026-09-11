/**
 * State-specific cultural themes for the interactive India map.
 *
 * Each entry associates a state with a soft, minimal cultural treatment:
 * an SVG gradient fill id, a subtle pattern-motif id, and a short cultural
 * descriptor shown in the map's side information area.
 *
 * All 28 states carry a theme. Fill gradients are shared per region to keep
 * the SVG defs small (only one state is ever active at a time), while motif
 * ids cycle across the palette for light variety.
 *
 * Keep every theme visually restrained: the map must always read as a map
 * first.
 */

export interface StateTheme {
  /** Human label like "Marathi Heritage" shown as a chip. */
  label: string
  /** One-line cultural descriptor for the side panel. */
  tagline: string
  /** id of the SVG gradient rendered as the hover/selected fill. */
  fillId: string
  /** id of the SVG pattern rendered as a faint texture overlay. */
  motifId: string
}

export const STATE_THEMES: Record<string, StateTheme> = {
  'Andhra Pradesh': {
    label: 'Telugu Heritage',
    tagline:
      'Satavahana stupas, the Tirumala hills, Kuchipudi and the Kalamkari of the Krishna delta.',
    fillId: 'theme-fill-south',
    motifId: 'theme-motif-a',
  },
  'Arunachal Pradesh': {
    label: 'Highland Buddhist Culture',
    tagline:
      'The Tawang monastery, Monpa masks, Apatani rites and the dawn-lit tribal valleys of the Eastern Himalaya.',
    fillId: 'theme-fill-ne',
    motifId: 'theme-motif-a',
  },
  Assam: {
    label: 'Brahmaputra Culture',
    tagline:
      'Ahom moidams, Kaziranga\u2019s rhinos, Vaishnava satras and the golden muga silks of Sualkuchi.',
    fillId: 'theme-fill-ne',
    motifId: 'theme-motif-b',
  },
  Bihar: {
    label: 'Magadha Heritage',
    tagline:
      'Bodh Gaya, Nalanda, Mauryan pillars, Madhubani painting and the riverine Chhath of the Ganga.',
    fillId: 'theme-fill-east',
    motifId: 'theme-motif-b',
  },
  Chhattisgarh: {
    label: 'Bastar Tribal Culture',
    tagline:
      'Danteshwari\u2019s Dussehra, Pandavani ballads, dhokra metal and the Mahanadi temple belt.',
    fillId: 'theme-fill-central',
    motifId: 'theme-motif-b',
  },
  Goa: {
    label: 'Konkan–Lusitanian Culture',
    tagline:
      'Baroque churches of Old Goa, Saraswat temples, shigmo floats and the feast-day villages.',
    fillId: 'theme-fill-west',
    motifId: 'theme-motif-c',
  },
  Gujarat: {
    label: 'Gujarati Heritage',
    tagline:
      'Dholavira and Lothal, Rani-ki-Vav, Modhera, garba nights and the crafts of Kutch.',
    fillId: 'theme-fill-west',
    motifId: 'theme-motif-a',
  },
  Haryana: {
    label: 'Kurukshetra Heritage',
    tagline:
      'The Gita\u2019s battlefield, Surajkund crafts, ragini theatre and the akharas of the north plains.',
    fillId: 'theme-fill-north',
    motifId: 'theme-motif-b',
  },
  'Himachal Pradesh': {
    label: 'Pahari Heritage',
    tagline:
      'Himalayan temples, Chamba rumal craft, hill-fort capitals and the Dev-bhumi ritual calendar.',
    fillId: 'theme-fill-north',
    motifId: 'theme-motif-c',
  },
  Jharkhand: {
    label: 'Chotanagpur Tribal Culture',
    tagline:
      'Sohrai murals, Seraikela Chhau, sacred groves and the Saarna rites of the plateau.',
    fillId: 'theme-fill-east',
    motifId: 'theme-motif-c',
  },
  Karnataka: {
    label: 'Kannada Heritage',
    tagline:
      'Hampi, the Hoysala temples, Mysuru Dasara, Yakshagana and the coffee country of the Ghats.',
    fillId: 'theme-fill-south',
    motifId: 'theme-motif-b',
  },
  Kerala: {
    label: 'Keralam Heritage',
    tagline:
      'Kathakali, Theyyam, backwaters, the padmanabhaswamy shrine and the spice-trade coast.',
    fillId: 'theme-fill-south',
    motifId: 'theme-motif-c',
  },
  'Madhya Pradesh': {
    label: 'Malwa & Bundelkhand Heritage',
    tagline:
      'Khajuraho, Sanchi, Bhimbetka, Gwalior\u2019s forts and the tiger forests of the Vindhyas.',
    fillId: 'theme-fill-central',
    motifId: 'theme-motif-c',
  },
  Maharashtra: {
    label: 'Marathi Heritage',
    tagline:
      'Maratha hill forts of the Sahyadri, the Ajanta\u2013Ellora caves, Warli painting and city Ganpati festivals.',
    fillId: 'theme-mh-fill',
    motifId: 'theme-mh-motif',
  },
  Manipur: {
    label: 'Meitei Heritage',
    tagline:
      'Classical Ras dance, the Kangla fort, Imphal\u2019s women\u2019s market and the cradle of polo.',
    fillId: 'theme-fill-ne',
    motifId: 'theme-motif-c',
  },
  Meghalaya: {
    label: 'Khasi & Garo Hills',
    tagline:
      'Living-root bridges, sacred groves, monoliths and the matrilineal cultures of the clouds.',
    fillId: 'theme-fill-ne',
    motifId: 'theme-motif-d',
  },
  Mizoram: {
    label: 'Mizo Culture',
    tagline:
      'Cheraw bamboo dance, Chapchar Kut, puan weaves and the song-voices of the Lushai hills.',
    fillId: 'theme-fill-ne',
    motifId: 'theme-motif-d',
  },
  Nagaland: {
    label: 'Naga Heritage',
    tagline:
      'The Hornbill Festival, warrior shawls, morung houses and the Kohima war memory.',
    fillId: 'theme-fill-ne',
    motifId: 'theme-motif-b',
  },
  Odisha: {
    label: 'Kalinga Heritage',
    tagline:
      'Konark\u2019s sun temple, Puri\u2019s Jagannath, Odissi dance and the patta-and-silk craft towns.',
    fillId: 'theme-fill-east',
    motifId: 'theme-motif-a',
  },
  Punjab: {
    label: 'Punjabi Heritage',
    tagline:
      'Gurdwara lands, bhangra and giddha, phulkari embroidery and the heritage villages of the Sutlej.',
    fillId: 'theme-fill-north',
    motifId: 'theme-motif-a',
  },
  Rajasthan: {
    label: 'Rajput Heritage',
    tagline:
      'Fort-palaces, blue cities, block-printed textiles, camel performances and the desert lakes.',
    fillId: 'theme-fill-north',
    motifId: 'theme-motif-d',
  },
  Sikkim: {
    label: 'Himalayan Buddhist Culture',
    tagline:
      'Rumtek and Pemayangtse gompas, Cham dances and the sacred massif of Khangchendzonga.',
    fillId: 'theme-fill-ne',
    motifId: 'theme-motif-a',
  },
  'Tamil Nadu': {
    label: 'Tamil Heritage',
    tagline:
      'Chola bronzes, Madurai\u2019s gopurams, Bharatanatyam, the Margazhi season and the silk looms.',
    fillId: 'theme-fill-south',
    motifId: 'theme-motif-a',
  },
  Telangana: {
    label: 'Deccani Culture',
    tagline:
      'Golconda and the Charminar, Kakatiya temples, Bathukamma and the pearl-and-biryani tables.',
    fillId: 'theme-fill-south',
    motifId: 'theme-motif-d',
  },
  Tripura: {
    label: 'Manikya Heritage',
    tagline:
      'Ujjayanta and Neermahal palaces, Tripuri festivals and the rock-carved hills of the frontier.',
    fillId: 'theme-fill-ne',
    motifId: 'theme-motif-c',
  },
  Uttarakhand: {
    label: 'Dev-bhumi Heritage',
    tagline:
      'Char Dham shrines, Kumaoni-Garhwali folkways, aipan art and the pilgrim trails of the Himalaya.',
    fillId: 'theme-fill-north',
    motifId: 'theme-motif-d',
  },
  'Uttar Pradesh': {
    label: 'Ganga-Jamuni Heritage',
    tagline:
      'Varanasi ghats, the Taj Mahal, Awadhi-urbane culture, Kathak and the melas of the Ganga plain.',
    fillId: 'theme-fill-north',
    motifId: 'theme-motif-b',
  },
  'West Bengal': {
    label: 'Bangali Heritage',
    tagline:
      'Durga Puja, the Tagore legacy, Sundarbans tigers, kathputli dramas and the sweets of Bengal.',
    fillId: 'theme-fill-east',
    motifId: 'theme-motif-d',
  },
}

/** Look up the cultural theme for a state by its official name. */
export function themeForState(name?: string | null): StateTheme | undefined {
  if (!name) return undefined
  return STATE_THEMES[name] ?? STATE_THEMES[name.trim()]
}

/** Look up a theme by id to guard the SVG defs at render time. */
export function themeById(id?: string | null): StateTheme | undefined {
  if (!id) return undefined
  return Object.values(STATE_THEMES).find((t) => t.fillId === id || t.motifId === id)
}