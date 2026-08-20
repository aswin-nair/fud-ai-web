import { create } from 'zustand';

import { hasFirstLogEvent } from '@/db/queries/localPrivacy';
import {
  createProfile,
  deviceTimeZone,
  getProfile,
  updateProfile,
} from '@/db/queries/profile';
import { type NewProfile, type Profile } from '@/db/schema';

type ProfileState = {
  profile: Profile | null;
  firstLogRecorded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  create: (values: NewProfile) => Promise<Profile>;
  update: (values: Partial<NewProfile>) => Promise<void>;
  /** The profile's zone, falling back to the device only before onboarding. */
  timezone: () => string;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  firstLogRecorded: false,
  loading: true,

  load: async () => {
    const [profile, firstLogRecorded] = await Promise.all([getProfile(), hasFirstLogEvent()]);
    set({ profile, firstLogRecorded, loading: false });
  },

  create: async (values) => {
    const profile = await createProfile(values);
    set({ profile, firstLogRecorded: false, loading: false });
    return profile;
  },

  update: async (values) => {
    const current = get().profile;
    if (!current) return;

    set({ profile: await updateProfile(current.id, values) });
  },

  timezone: () => get().profile?.timezone ?? deviceTimeZone(),
}));
