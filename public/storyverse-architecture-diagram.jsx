import React, { useState } from 'react';
import { Monitor, Database, Mic, Cloud, Server, Users, BookOpen, Sparkles, ArrowRight, ArrowDown, Zap, Globe, Shield, CreditCard } from 'lucide-react';

export default function StoryVerseArchitecture() {
  const [activeLayer, setActiveLayer] = useState(null);
  const [activeFlow, setActiveFlow] = useState(null);

  const layers = [
    {
      id: 'frontend',
      name: 'Frontend Layer',
      color: 'bg-blue-500',
      icon: Monitor,
      tech: ['Next.js 14', 'TailwindCSS', 'Framer Motion', 'Zustand'],
      description: 'Server-side rendering, responsive UI, real-time updates'
    },
    {
      id: 'api',
      name: 'API Layer',
      color: 'bg-purple-500',
      icon: Server,
      tech: ['Vercel Edge Functions', 'Serverless Functions', 'WebSocket'],
      description: 'RESTful endpoints, real-time voice streaming, webhooks'
    },
    {
      id: 'ai',
      name: 'AI Layer',
      color: 'bg-pink-500',
      icon: Sparkles,
      tech: ['Claude API', 'FLUX Pro', 'ElevenLabs Jillian'],
      description: 'Story generation, image synthesis, voice cloning & narration'
    },
    {
      id: 'data',
      name: 'Data Layer',
      color: 'bg-green-500',
      icon: Database,
      tech: ['Supabase PostgreSQL', 'Supabase Storage', 'CDN'],
      description: 'User data, story memory, media assets, auth'
    }
  ];

  const dataFlows = [
    { id: 'story', name: 'Story Creation', color: 'text-blue-400' },
    { id: 'voice', name: 'Voice Interaction', color: 'text-purple-400' },
    { id: 'memory', name: 'Memory Sync', color: 'text-green-400' }
  ];

  const integrations = [
    { name: 'ElevenLabs', icon: Mic, desc: 'Jillian Agent + Voice Cloning', color: 'bg-violet-600' },
    { name: 'Supabase', icon: Database, desc: 'DB + Auth + Storage', color: 'bg-emerald-600' },
    { name: 'Vercel', icon: Globe, desc: 'Edge Deployment', color: 'bg-slate-700' },
    { name: 'Stripe', icon: CreditCard, desc: 'Subscriptions', color: 'bg-indigo-600' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          StoryVerse Architecture
        </h1>
        <p className="text-slate-400 mt-2">AI-Powered Personalized Children's Book Platform</p>
      </div>

      {/* Main Architecture Grid */}
      <div className="max-w-6xl mx-auto">
        
        {/* System Layers */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            System Layers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {layers.map((layer, idx) => {
              const Icon = layer.icon;
              const isActive = activeLayer === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayer(isActive ? null : layer.id)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 
                    ${isActive ? 'border-white scale-105 shadow-xl' : 'border-slate-700 hover:border-slate-500'}
                    ${layer.color} bg-opacity-20`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1 ${layer.color} rounded-t-xl`} />
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${layer.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">{layer.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {layer.tech.map(t => (
                      <span key={t} className="text-xs px-2 py-1 bg-slate-800 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                  {isActive && (
                    <p className="text-sm text-slate-300 mt-2 animate-fadeIn">
                      {layer.description}
                    </p>
                  )}
                  {idx < layers.length - 1 && (
                    <ArrowDown className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 text-slate-500 hidden md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Flows */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-cyan-400" />
            Data Flows
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'story',
                title: 'Story Creation Flow',
                color: 'border-blue-500',
                steps: ['User Input', 'AI Story Gen', 'Image Gen', 'Voice Synthesis', 'Book Compilation']
              },
              {
                id: 'voice', 
                title: 'Voice Interaction Flow',
                color: 'border-purple-500',
                steps: ['User Speech', 'Jillian Agent', 'Context Lookup', 'Response Gen', 'Audio Stream']
              },
              {
                id: 'memory',
                title: 'Memory Persistence Flow', 
                color: 'border-green-500',
                steps: ['User Actions', 'Profile Update', 'Memory Engine', 'Story Continuity', 'Next Book']
              }
            ].map(flow => (
              <div
                key={flow.id}
                onClick={() => setActiveFlow(activeFlow === flow.id ? null : flow.id)}
                className={`p-4 rounded-xl border-2 ${flow.color} bg-slate-800 cursor-pointer
                  transition-all ${activeFlow === flow.id ? 'scale-105 shadow-xl' : 'hover:bg-slate-750'}`}
              >
                <h3 className="font-semibold mb-3">{flow.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {flow.steps.map((step, i) => (
                    <React.Fragment key={step}>
                      <span className="text-xs px-2 py-1 bg-slate-700 rounded">
                        {step}
                      </span>
                      {i < flow.steps.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-500 self-center" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Integrations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-orange-400" />
            Key Integrations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrations.map(int => {
              const Icon = int.icon;
              return (
                <div key={int.name} className={`p-4 rounded-xl ${int.color} bg-opacity-30 border border-slate-700`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{int.name}</span>
                  </div>
                  <p className="text-xs text-slate-300">{int.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database Schema Preview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Core Database Tables
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { name: 'families', fields: ['id', 'subscription', 'created_at'] },
              { name: 'children', fields: ['id', 'family_id', 'name', 'age', 'interests'] },
              { name: 'books', fields: ['id', 'child_id', 'title', 'status', 'pages'] },
              { name: 'story_memory', fields: ['id', 'child_id', 'characters', 'events'] },
              { name: 'voice_profiles', fields: ['id', 'user_id', 'elevenlabs_id'] }
            ].map(table => (
              <div key={table.name} className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                <div className="font-mono text-sm text-emerald-400 mb-2">{table.name}</div>
                <div className="space-y-1">
                  {table.fields.map(f => (
                    <div key={f} className="text-xs text-slate-400 font-mono">• {f}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            Core API Endpoints
          </h2>
          <div className="bg-slate-800 rounded-xl p-4 font-mono text-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-left">
                  <th className="pb-2 pr-4">Method</th>
                  <th className="pb-2 pr-4">Endpoint</th>
                  <th className="pb-2">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  ['POST', '/api/books/create', 'Initialize book generation'],
                  ['GET', '/api/books/[id]/status', 'Check generation progress'],
                  ['POST', '/api/voice/clone', 'Submit voice sample'],
                  ['WS', '/api/voice/conversation', 'Jillian agent connection'],
                  ['GET', '/api/children/[id]/memory', 'Retrieve story memory'],
                  ['POST', '/api/narration/generate', 'Generate audio narration']
                ].map(([method, endpoint, purpose], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-slate-850' : ''}>
                    <td className={`py-2 pr-4 ${
                      method === 'POST' ? 'text-green-400' : 
                      method === 'GET' ? 'text-blue-400' : 
                      'text-yellow-400'
                    }`}>{method}</td>
                    <td className="py-2 pr-4 text-cyan-300">{endpoint}</td>
                    <td className="py-2 text-slate-400">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tech Stack Summary */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-850 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Technology Stack Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">Frontend</h3>
              <ul className="text-slate-300 space-y-1">
                <li>• Next.js 14 (App Router)</li>
                <li>• TypeScript</li>
                <li>• TailwindCSS</li>
                <li>• Framer Motion</li>
                <li>• Zustand + React Query</li>
              </ul>
            </div>
            <div>
              <h3 className="text-purple-400 font-semibold mb-2">Backend</h3>
              <ul className="text-slate-300 space-y-1">
                <li>• Vercel Serverless</li>
                <li>• Edge Functions</li>
                <li>• WebSocket (Voice)</li>
                <li>• Supabase Auth</li>
              </ul>
            </div>
            <div>
              <h3 className="text-pink-400 font-semibold mb-2">AI Services</h3>
              <ul className="text-slate-300 space-y-1">
                <li>• Claude API (Stories)</li>
                <li>• FLUX Pro (Images)</li>
                <li>• ElevenLabs Jillian</li>
                <li>• Voice Cloning</li>
              </ul>
            </div>
            <div>
              <h3 className="text-green-400 font-semibold mb-2">Infrastructure</h3>
              <ul className="text-slate-300 space-y-1">
                <li>• Supabase (PostgreSQL)</li>
                <li>• Supabase Storage</li>
                <li>• Vercel CDN</li>
                <li>• Stripe Billing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          StoryVerse Architecture v1.0 | January 2026
        </div>
      </div>
    </div>
  );
}
