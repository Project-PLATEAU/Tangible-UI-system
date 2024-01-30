// import { atom } from 'recoil'
export type Photo = {
  file: File
  isStorage: boolean
}

const makeDateIDString = (date: Date, separator: string) => {
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  const sec = date.getSeconds().toString().padStart(2, "0");
  return "" + year + separator + month + separator + day + separator + hour + separator + min + separator + sec;
};

export const PhotoUtils = {
  makeDateIDString,
}