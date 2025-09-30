import { UserState } from "@/types/state";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserState = create<UserState>()(
  persist(
    (set, get) => ({
      loginId: "",
      setLoginId: (id: string) => set({ loginId: id }),
      userId: "",
      setUserId: (id: string) => set({ userId: id }),
    }),
    { name: "user-state" }
  )
);
