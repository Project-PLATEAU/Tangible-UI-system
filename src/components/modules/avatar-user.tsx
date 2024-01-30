import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { Photo } from "../../utils/models/Photo";
import { UserDataAtom, UserUtils } from "../../utils/UserUtils";

export function UserAvatar(props: {
    size: number,
    initial?: boolean
    photo?: Photo,
}) {
    const userData = useRecoilValue(UserDataAtom);
    const [photo, setPhoto] = useState<Photo | undefined>(undefined);
    const [initial, setInitial] = useState(props.initial ?? false);

    useEffect(() => {
        if (props.photo) {
            setPhoto(props.photo);
            setInitial(true);
        }
    }, [props.photo])

    useEffect(() => {
        loadUserData();
    }, [userData]);

    const loadUserData = async () => {       
        if (!photo) {
            if(!initial) {
                const p = await UserUtils.getProfileImage(userData);
                if(p) {
                    setPhoto(p);
                    setInitial(true);
                }
            }
        }
    }
    
    const getUserAlt = () => {
        return userData.displayName !== "" ? userData.displayName : "user";
    }

    return (
        <>
            {photo ? (
                <Avatar
                    alt={ getUserAlt() }
                    src={UserUtils.getAavatorSrc(photo)}
                    sx={{ width: props.size, height: props.size }}
                />
            ) : (
                <Avatar {...UserUtils.stringAvatar(getUserAlt(), props.size)} />
            )}
        </>
    )
}


export function UserAvatarWrap(props: {
    size: number,
    photo?: Photo,
}) {
    const userData = useRecoilValue(UserDataAtom);
    const [photo, setPhoto] = useState<Photo | undefined>(undefined);

    useEffect(() => {
        if (props.photo) {
            setPhoto(props.photo);
        }
    }, [props.photo])
    
    const getUserAlt = () => {
        return userData.displayName !== "" ? userData.displayName : "user";
    }

    return (
        <Box className="avatar-user">
            <figure className="avatar avatar-user__avatar">
                <UserAvatar photo={photo} size={40} />
            </figure>
            <dl className="avatar-user__define">
                <dt className="avatar-user__heading">オーガナイザー</dt>
                <dd className="avatar-user__text">{ getUserAlt() }</dd>
            </dl>
        </Box>
    )
}

