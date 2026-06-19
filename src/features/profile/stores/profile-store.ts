import type { AddressFormValues } from "@/features/profile/schemas/profile";
import { create } from "zustand";

type ProfileStore = {
  personalDialogOpen: boolean;
  addressDialogOpen: boolean;
  editingIndex: number | null;
  addressDraft: AddressFormValues | null;
  setPersonalDialogOpen: (open: boolean) => void;
  openAddressDialog: (
    address: AddressFormValues,
    editingIndex?: number | null,
  ) => void;
  closeAddressDialog: () => void;
};

export const useProfileStore = create<ProfileStore>((set) => ({
  personalDialogOpen: false,
  addressDialogOpen: false,
  editingIndex: null,
  addressDraft: null,
  setPersonalDialogOpen: (personalDialogOpen) => set({ personalDialogOpen }),
  openAddressDialog: (addressDraft, editingIndex = null) =>
    set({ addressDialogOpen: true, addressDraft, editingIndex }),
  closeAddressDialog: () =>
    set({
      addressDialogOpen: false,
      addressDraft: null,
      editingIndex: null,
    }),
}));
