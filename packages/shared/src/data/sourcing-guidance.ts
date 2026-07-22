import type { ResearchInterest } from '@swift-travel/database';

export interface SourceQuery {
  label: string;
  query: string;
}

export interface SourcingGuidance {
  interest: ResearchInterest;
  queries: SourceQuery[];
  trustedDomains: string[];
  excludeDomains: string[];
  minResults: number;
  maxResults: number;
}

export const SOURCING_GUIDANCE: Record<ResearchInterest, SourcingGuidance> = {
  food: {
    interest: 'food',
    queries: [
      {
        label: 'local food blogs',
        query: '{city} best new restaurants local food blog 2026',
      },
      {
        label: 'reddit recommendations',
        query: 'site:reddit.com r/{city} best restaurants hidden gems',
      },
      {
        label: 'critic picks',
        query: '{city} restaurant critic picks must-try dining',
      },
      {
        label: 'food scene deep dive',
        query: '{city} food scene emerging chefs unique dining experiences',
      },
    ],
    trustedDomains: [
      'eater.com',
      'infatuation.com',
      'yelp.com',
      'reddit.com',
      'nytimes.com',
      'bonappetit.com',
      'foodandwine.com',
      'thrillist.com',
    ],
    excludeDomains: [
      'tripadvisor.com',
      'opentable.com',
      'grubhub.com',
      'doordash.com',
    ],
    minResults: 8,
    maxResults: 12,
  },

  'arts-culture': {
    interest: 'arts-culture',
    queries: [
      {
        label: 'museums and galleries',
        query: '{city} best museums galleries art exhibits 2026',
      },
      {
        label: 'local arts scene',
        query: '{city} local art scene galleries creative spaces',
      },
      {
        label: 'cultural events',
        query: '{city} cultural events performances live music',
      },
    ],
    trustedDomains: [
      'timeout.com',
      'artsy.net',
      'reddit.com',
      'local arts council sites',
    ],
    excludeDomains: ['tripadvisor.com', 'viator.com'],
    minResults: 6,
    maxResults: 10,
  },

  nightlife: {
    interest: 'nightlife',
    queries: [
      {
        label: 'bars and lounges',
        query: '{city} best bars cocktail lounges speakeasy 2026',
      },
      {
        label: 'local scene',
        query: '{city} nightlife scene where locals go drinks',
      },
    ],
    trustedDomains: ['timeout.com', 'eater.com', 'thrillist.com', 'reddit.com'],
    excludeDomains: ['tripadvisor.com', 'yelp.com'],
    minResults: 6,
    maxResults: 10,
  },

  outdoors: {
    interest: 'outdoors',
    queries: [
      {
        label: 'hiking and trails',
        query: '{city} best hiking trails outdoor activities nature',
      },
      {
        label: 'parks and green spaces',
        query: '{city} parks gardens outdoor recreation hidden trails',
      },
    ],
    trustedDomains: [
      'alltrails.com',
      'reddit.com',
      'national park sites',
      'state park sites',
    ],
    excludeDomains: ['tripadvisor.com', 'viator.com'],
    minResults: 6,
    maxResults: 10,
  },

  shopping: {
    interest: 'shopping',
    queries: [
      {
        label: 'local boutiques',
        query: '{city} best local boutiques unique shops vintage stores',
      },
      {
        label: 'markets and districts',
        query: '{city} shopping districts markets local makers',
      },
    ],
    trustedDomains: ['timeout.com', 'reddit.com', 'local business directories'],
    excludeDomains: ['tripadvisor.com', 'amazon.com', 'walmart.com'],
    minResults: 5,
    maxResults: 8,
  },
};
