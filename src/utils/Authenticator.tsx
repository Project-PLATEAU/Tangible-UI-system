import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { app } from './firebase/init'
import { refreshUserData, UserDataAtom, userLoginState } from './UserUtils'

export const logout = (): Promise<void> => {
  const auth = getAuth(app)
  return signOut(auth)
}

export const useAuth = (): boolean => {
  const setUser = useSetRecoilState(userLoginState)
  const [isLoading, setIsLoading] = useState(true)
  const setUserData = useSetRecoilState(UserDataAtom)
  useEffect(() => {
    const auth = getAuth(app)
    return onAuthStateChanged(auth, (user) => {
      setUser(user)
      refreshUserData().then((value) => {
        // console.log('userData')
        // console.log(value)
        setUserData(value)
      })
      setIsLoading(false)
    })
  }, [setUser])
  return isLoading
}

export const useUser = () => {
  return useRecoilValue(userLoginState)
}
