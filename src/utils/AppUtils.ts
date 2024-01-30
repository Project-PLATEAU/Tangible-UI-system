import { atom } from 'recoil'

export const VRAtom = atom({
  key: "vrsetting",
  default: {
    ground: 0,
    focus: "",
    lod1: true,
  }
});

export const EditAreaAtom = atom({
  key: "areaedit",
  default: {
    edit: false,
    id: "",
  }
});
