import { atom } from 'recoil'
import { User } from 'firebase/auth'
import { getUserData, downloadProfileImageFromStorage } from './firebase/firebase'
import { auth } from './firebase/init'
import { Photo } from './models/Photo'

export const UserDataAtom = atom({
  key: "userData",
  default: {
    displayName: "",
    profile: "" as string | null,
    uid: "",
    isLogin: false,
  }
});

export type UserData = {
  displayName: string
  profile: string | null
  uid: string
  isLogin: boolean
};

export const refreshUserData = async () => {
  const uid = auth.currentUser?.uid ?? null;
  if (uid) {
    try {
      const userData = await getUserData(uid);
      return {
        displayName: userData.displayName ?? "",
        profile: userData.profile ?? null,
        uid: userData.uid,
        isLogin: true,
      };
    } catch (e) {
      console.error(e);
      console.log("load userDat error:" + uid);
    }
  } else {
    console.log("refresh failed. user id is null");
  }
  return {
    displayName: "",
    profile: null,
    uid: "",
    isLogin: false,
  };
};

export const userLoginState = atom<User | null>({
  key: "userState",
  default: null,
  dangerouslyAllowMutability: true
});

const initUserData = () => {
  return {
    displayName: "",
    profile: "",
    uid: "",
    isLogin: false,
  };
};

const getAavatorSrc = (aPhoto: Photo) => {
  if (aPhoto && aPhoto.file) {
    return window.URL.createObjectURL(aPhoto.file);
  }
  return undefined;
};

const getProfileImage = async (userData: UserData) => {
  if (userData.profile && userData.profile !== "") {
    try {
      const file = await downloadProfileImageFromStorage(
        userData.uid,
        userData.profile,
      );
      return {
        file: file,
        isStorage: true,
      } as Photo;
    } catch (e) {
      console.error(e);
      console.log("profile download err:" + userData.profile);
    }
  }
  return undefined;
};


const stringToColor = (string: string) => {
  let hash = 0;
  let i;

  // /* eslint-enable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  // /* eslint-enable no-bitwise */
  // console.log(color)
  // console.log(string)
  return color;
};

const stringAvatar = (name: string, size: number) => {
  return {
    sx: {
      bgcolor: stringToColor(name),
      width: size,
      height: size,
    },
    children: `${name.split(' ')[0][0]}`,
  };
};

export const getDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return "" + y + "-" + m + "-" + d;
}

export const UserUtils = {
  getAavatorSrc,
  getProfileImage,
  stringAvatar,
  initUserData,
  getDateString,
};
