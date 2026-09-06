export interface Initiative {
  organization: string
  title: string
  description: string
  link?: string
  icon?: string
}

const governmentInitiatives: Initiative[] = [
  {
    organization: 'Ministry of Culture',
    title: 'National Mission on Cultural Mapping',
    description:
      'A comprehensive initiative to map India\'s cultural assets across districts, creating a digital repository of art forms, performers, and cultural practitioners.',
    link: 'https://culture.gov.in',
    icon: '🗺️',
  },
  {
    organization: 'Ministry of Culture',
    title: 'Mera Gaon Meri Dharohar',
    description:
      'A programme documenting the cultural heritage of over 6 lakh villages across India, capturing local traditions, art, and intangible heritage.',
    link: 'https://culture.gov.in',
    icon: '🏘️',
  },
  {
    organization: 'Ministry of Culture',
    title: 'Gyan Bharatam',
    description:
      'A national initiative for the survey, documentation, and digitisation of ancient manuscripts held in libraries, museums, and private collections across India.',
    link: 'https://culture.gov.in',
    icon: '📜',
  },
  {
    organization: 'Ministry of Culture',
    title: 'National Museum Digitisation',
    description:
      'An initiative to digitise collections across India\'s national museums, making artefacts and archival material accessible through online virtual galleries.',
    link: 'https://culture.gov.in',
    icon: '🏛️',
  },
  {
    organization: 'Government of India',
    title: 'Azadi Ka Amrit Mahotsav',
    description:
      'A nationwide celebration marking 75 years of India\'s independence, honouring the freedom struggle and showcasing India\'s cultural evolution.',
    link: 'https://azadimahotsav.gov.in',
    icon: '🇮🇳',
  },
  {
    organization: 'UNESCO & Ministry of Culture',
    title: 'UNESCO World Heritage Sites',
    description:
      'India\'s partnership with UNESCO for the nomination, conservation, and promotion of cultural and natural sites of outstanding universal value.',
    link: 'https://whc.unesco.org/en/statesparties/in',
    icon: '🌍',
  },
  {
    organization: 'Ministry of Culture',
    title: 'Intangible Cultural Heritage',
    description:
      'India\'s efforts to safeguard intangible cultural heritage elements including traditional crafts, performing arts, rituals, and oral traditions recognised by UNESCO.',
      link: 'https://ich.unesco.org/en/state/india-IN',
    icon: '🎭',
  },
  {
    organization: 'Ministry of Culture',
    title: 'National Culture Fund',
    description:
      'A trust enabling public-private partnerships for the preservation and promotion of India\'s heritage monuments, museums, and cultural institutions.',
    link: 'https://culture.gov.in',
    icon: '🤝',
  },
  {
    organization: 'Ministry of Tourism & Culture',
    title: 'PRASHAD Scheme',
    description:
      'Pilgrimage Rejuvenation and Spiritual, Heritage Augmentation Drive — a mission to develop world-class infrastructure at important religious and pilgrimage destinations.',
    link: 'https://tourism.gov.in',
    icon: '🛕',
  },
  {
    organization: 'Ministry of Culture',
    title: 'Monuments of National Importance',
    description:
      'The Archaeological Survey of India\'s programme for the protection and conservation of over 3,600 centrally protected monuments across the country.',
    link: 'https://asi.nic.in',
    icon: '🏰',
  },
  {
    organization: 'Ministry of Culture',
    title: 'Museum Development Programme',
    description:
      'A national initiative to upgrade, modernise, and establish museums across India, enhancing public access to cultural and historical collections.',
    link: 'https://culture.gov.in',
    icon: '🏺',
  },
  {
    organization: 'Ministry of Culture',
    title: 'Humnabin — Digital Cultural Heritage',
    description:
      'A digital initiative for the documentation, preservation, and online dissemination of India\'s tangible and intangible cultural heritage resources.',
    link: 'https://culture.gov.in',
    icon: '💻',
  },
  {
    organization: 'Ministry of Culture',
    title: 'Cultural Heritage Youth Programme',
    description:
      'Engaging young Indians in heritage awareness through workshops, internships, and field projects at heritage sites and cultural institutions nationwide.',
    link: 'https://culture.gov.in',
    icon: '🧑‍🎓',
  },
  {
    organization: 'Ministry of External Affairs',
    title: 'Global Initiative for Cultural Heritage',
    description:
      'India\'s international cultural diplomacy efforts to promote heritage conservation cooperation and knowledge exchange with partner nations.',
    link: 'https://mea.gov.in',
    icon: '🌐',
  },
  {
    organization: 'Ministry of Culture',
    title: 'Sangit Natak Akademi Fellowships',
    description:
      'Fellowships supporting research, documentation, and creative projects in performing arts, music, dance, theatre, and oral traditions of India.',
    link: 'https://sangitnatak.org',
    icon: '🎶',
  },
  {
    organization: 'Ministry of Culture',
    title: 'Lalit Kala Akademi Grants',
    description:
      'Support for visual artists through national and regional grants for painting, sculpture, printmaking, and other fine art disciplines.',
    link: 'https://lalitkala.gov.in',
    icon: '🎨',
  },
]

export default governmentInitiatives
