'use client';

import React from 'react';
import { useRequirementsStore } from '@/stores/requirementsStore';
import type { PersonaType } from '@swift-travel/shared';

interface PersonaOption {
  id: PersonaType;
  title: string;
  description: string;
  icon: string;
  features: string[];
  color: string;
}

const personaOptions: PersonaOption[] = [
  {
    id: 'photography',
    title: 'Photography Weekend',
    description: 'Perfect for capturing stunning shots and discovering photogenic spots',
    icon: '📸',
    features: [
      'Golden hour locations',
      'Instagram-worthy spots',
      'Hidden photography gems',
      'Local art scenes'
    ],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'food-forward',
    title: 'Food-Forward Explorer',
    description: 'Culinary adventures featuring local flavors and dining experiences',
    icon: '🍽️',
    features: [
      'Local specialties',
      'Food markets & tours',
      'Chef recommendations',
      'Street food gems'
    ],
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'architecture',
    title: 'Architecture Enthusiast',
    description: 'Explore stunning buildings, historical sites, and design landmarks',
    icon: '🏛️',
    features: [
      'Architectural marvels',
      'Historical landmarks',
      'Design districts',
      'Urban planning tours'
    ],
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'family',
    title: 'Family Adventure',
    description: 'Kid-friendly activities and experiences the whole family will love',
    icon: '👨‍👩‍👧‍👦',
    features: [
      'Family-friendly activities',
      'Educational experiences',
      'Safe neighborhoods',
      'Kid-approved restaurants'
    ],
    color: 'from-green-500 to-teal-500'
  }
];

export default function PersonaStep() {
  const { persona, setPersona, errors } = useRequirementsStore();
  
  const handlePersonaSelect = (selectedPersona: PersonaType) => {
    setPersona(selectedPersona);
  };
  
  const hasError = errors.persona;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What's your travel style?
        </h2>
        <p className="text-gray-600">
          Choose the persona that best matches your interests. This helps our AI agents curate the perfect activities for you.
        </p>
      </div>
      
      {hasError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600" role="alert">
            {hasError}
          </p>
        </div>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2">
        {personaOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handlePersonaSelect(option.id)}
            className={`p-6 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              persona === option.id
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            aria-pressed={persona === option.id}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                {option.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-semibold mb-2 ${
                  persona === option.id ? 'text-indigo-900' : 'text-gray-900'
                }`}>
                  {option.title}
                </h3>
                
                <p className={`text-sm mb-3 ${
                  persona === option.id ? 'text-indigo-700' : 'text-gray-600'
                }`}>
                  {option.description}
                </p>
                
                <ul className="space-y-1">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <svg 
                        className={`w-4 h-4 mr-2 flex-shrink-0 ${
                          persona === option.id ? 'text-indigo-500' : 'text-gray-400'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={
                        persona === option.id ? 'text-indigo-700' : 'text-gray-600'
                      }>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {persona === option.id && (
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {/* AI explanation */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              How This Works
            </h4>
            <p className="text-sm text-gray-600">
              Your selected persona guides our specialized AI agents as they research, curate, and validate recommendations. Each persona has unique algorithms optimized for different travel interests and preferences.
            </p>
          </div>
        </div>
      </div>
      
      {persona && (
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${personaOptions.find(p => p.id === persona)?.color} flex items-center justify-center text-lg mr-3`}>
              {personaOptions.find(p => p.id === persona)?.icon}
            </div>
            <div>
              <h4 className="text-sm font-medium text-indigo-900">
                Great choice! 
              </h4>
              <p className="text-sm text-indigo-700">
                Our AI agents will focus on {personaOptions.find(p => p.id === persona)?.title.toLowerCase()} experiences.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}