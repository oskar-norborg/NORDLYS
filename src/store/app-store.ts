import { create } from "zustand";
import type { CapitalMarketAssumptions, ClientProfile, WhatIf } from "@/engine/types";
import { defaultCma } from "@/engine/portfolios";
import { DEMO_CLIENTS, blankProfile, cloneProfile } from "@/data/demos";
import { defaultWhatIf, loadPersisted, savePersisted } from "@/data/storage";

type Mode = "demo" | "mydata";
type SimQuality = "preview" | "full";

interface AppState {
  hydrated: boolean;
  mode: Mode;
  privacy: boolean;
  demoId: string;
  profile: ClientProfile;
  mydata: ClientProfile;
  cma: CapitalMarketAssumptions;
  whatIf: WhatIf;
  simQuality: SimQuality;
  hydrate: () => void;
  persist: () => void;
  setMode: (mode: Mode) => void;
  setPrivacy: (privacy: boolean) => void;
  loadDemo: (id: string) => void;
  copyDemoToMyData: () => void;
  setProfile: (patch: Partial<ClientProfile>) => void;
  setMembers: (members: ClientProfile["members"]) => void;
  setGoals: (goals: ClientProfile["goals"]) => void;
  setAnswers: (answers: number[]) => void;
  setCma: (cma: CapitalMarketAssumptions) => void;
  resetCma: () => void;
  setWhatIf: (patch: Partial<WhatIf>) => void;
  resetWhatIf: () => void;
  beginLiveEdit: () => void;
  endLiveEdit: () => void;
}

function demoById(id: string): ClientProfile {
  const found = DEMO_CLIENTS.find((c) => c.id === id) ?? DEMO_CLIENTS[0]!;
  return cloneProfile(found);
}

function activeProfile(mode: Mode, demoId: string, mydata: ClientProfile): ClientProfile {
  return mode === "demo" ? demoById(demoId) : mydata;
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  mode: "demo",
  privacy: false,
  demoId: "demo-emilie",
  profile: demoById("demo-emilie"),
  mydata: blankProfile(),
  cma: defaultCma(),
  whatIf: defaultWhatIf(),
  simQuality: "full",

  hydrate: () => {
    if (get().hydrated) return;
    const saved = loadPersisted();
    const profile = activeProfile(saved.mode, saved.demoId, saved.mydata);
    set({
      hydrated: true,
      mode: saved.mode,
      privacy: saved.privacy,
      demoId: saved.demoId,
      profile,
      mydata: saved.mydata,
      cma: saved.cma,
      whatIf: {
        ...saved.whatIf,
        fee: saved.whatIf.fee ?? profile.fee,
        rebalance: saved.whatIf.rebalance === "none" ? "none" : "monthly",
      },
      simQuality: "full",
    });
  },

  persist: () => {
    const s = get();
    savePersisted({
      mode: s.mode,
      privacy: s.privacy,
      demoId: s.demoId,
      mydata: s.mydata,
      cma: s.cma,
      whatIf: s.whatIf,
    });
  },

  setMode: (mode) => {
    if (get().mode === mode) return;
    const s = get();
    const profile = activeProfile(mode, s.demoId, s.mydata);
    set({
      mode,
      profile,
      whatIf: { ...defaultWhatIf(profile.fee) },
    });
    get().persist();
  },

  setPrivacy: (privacy) => {
    set({ privacy });
    get().persist();
  },

  loadDemo: (id) => {
    const profile = demoById(id);
    set({
      mode: "demo",
      demoId: id,
      profile,
      whatIf: defaultWhatIf(profile.fee),
    });
    get().persist();
  },

  copyDemoToMyData: () => {
    const profile = { ...cloneProfile(get().profile), id: "mydata" };
    set({
      mode: "mydata",
      mydata: profile,
      profile,
      whatIf: defaultWhatIf(profile.fee),
    });
    get().persist();
  },

  setProfile: (patch) => {
    const s = get();
    const profile = { ...s.profile, ...patch };
    if (s.mode === "mydata") set({ profile, mydata: profile });
    else set({ profile });
    get().persist();
  },

  setMembers: (members) => get().setProfile({ members }),
  setGoals: (goals) => get().setProfile({ goals }),
  setAnswers: (answers) => get().setProfile({ answers }),

  setCma: (cma) => {
    set({ cma });
    get().persist();
  },

  resetCma: () => {
    set({ cma: defaultCma() });
    get().persist();
  },

  setWhatIf: (patch) => set({ whatIf: { ...get().whatIf, ...patch } }),

  resetWhatIf: () => set({ whatIf: defaultWhatIf(get().profile.fee), simQuality: "full" }),

  beginLiveEdit: () => set({ simQuality: "preview" }),

  endLiveEdit: () => set({ simQuality: "full" }),
}));
