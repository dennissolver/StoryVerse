"use client";

import { create } from 'zustand';
import type { VoiceProfile } from '@/types/database';

interface VoiceState {
  voiceProfiles: VoiceProfile[];
  isRecording: boolean;
  isConnected: boolean;
  setRecording: (recording: boolean) => void;
  setConnected: (connected: boolean) => void;
  setVoiceProfiles: (profiles: VoiceProfile[]) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  voiceProfiles: [],
  isRecording: false,
  isConnected: false,
  setRecording: (recording) => set({ isRecording: recording }),
  setConnected: (connected) => set({ isConnected: connected }),
  setVoiceProfiles: (profiles) => set({ voiceProfiles: profiles }),
}));
