// import { atom } from 'recoil'

export type Tran = {
  gmlID: string
  footprint: {
    latitude: number
    longitude: number
    altitude: number
  }[]
  center: {
    latitude: number
    longitude: number
    altitude: number
  }
  subID: string
  created: Date
  modified: Date
  radius: number
}

const findTranFromGmlID = (
  gmlID: string,
  dataList: Array<Tran>
) => {
  const objList = dataList.filter((tran: Tran) => {
    return tran.gmlID === gmlID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}



export const TranUtils = {
  findTranFromGmlID,
}
