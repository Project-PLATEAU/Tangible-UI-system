import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";

import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";

import { UserAvatar } from "./components/modules/avatar-user";
import { updateUserData } from "./utils/firebase/firebase";
import { Photo } from "./utils/models/Photo";
import { UserDataAtom, UserUtils, refreshUserData } from "./utils/UserUtils";

function Profile() {
    const [userData, setUserData] = useRecoilState(UserDataAtom);

    const [photo, setPhoto] = useState<Photo | undefined>(undefined);
    const [formDisplayName, setFormDisplayName] = useState<string>("");
    const [progress, setProgress] = useState(false);
    const [errMode, setErrMode] = useState({ flag: false, message: "" });
  

    useEffect(() => {
        loadUserData();
    }, [userData]);

    const loadUserData = async () => {
        if (!photo) {
          const p = await UserUtils.getProfileImage(userData);
          setPhoto(p);
        }
        setFormDisplayName(userData.displayName);
    };

    const formChange = (type: string, value: string) => {
        if (type === "name") {
          setFormDisplayName(value);
        }
    };

    const inputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files !== null) {
          const file = event.target.files[0];
          const aPhoto: Photo = {
            file: file,
            isStorage: false,
          };
          setPhoto(aPhoto);
        }
    };

    const submitBtnPressed = async () => {
        if (!progress) {
          setProgress(true);
          try {
            if (await updateUserData(formDisplayName, photo)) {
              setErrMode({
                flag: false,
                message: "",
              });
              refreshUserData().then((value) => {
                console.log(value);
                setUserData(value);
              });
            } else {
              setErrMode({
                flag: true,
                message: "不明なエラーが発生しました。後ほどやり直してください。",
              });
            }
          } catch (e) {
            console.log(e);
            if (e instanceof Error) {
              setErrMode({
                flag: true,
                message: e.message,
              });
            } else {
              setErrMode({
                flag: true,
                message: "不明なエラーが発生しました。後ほどやり直してください。",
              });
            }
          }
          setProgress(false);
        }
    };

    return (
        <main className="main -logout">
            <Box className="logout-box">
                <h2 className="logout-box__heading">プロフィール編集</h2>
                <IconButton aria-label="写真アップロード" component="label" className="file">
                    {/* ファイル選択済みの時はsrcにパスが入る想定です */}
                    {/* <img src={avatarImage} className="file__circle" alt="" width={76} height={76} decoding="async" /> */}
                    <UserAvatar photo={photo} size={144} initial={true}/>
                    <PhotoCameraIcon className="icon file__icon" />
                    <input hidden accept="image/*" type="file" onChange={inputChange}/>
                </IconButton>
                <Box className="logout-box__list">
                    <TextField
                        id="name"
                        label="Display name"
                        variant="standard"
                        className="logout-box__item"
                        value={formDisplayName}
                        fullWidth
                        onChange={ e => formChange("name", e.target.value) }
                    />
                </Box>
                {errMode.flag && (
                    <Box sx={{ m: "20px" }} color="error">
                        <p style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "#e63b43",
                            textAlign: "center"
                        }}>
                            {errMode.message}
                        </p>
                    </Box>
                )}
                <Button variant="contained" color="primary" className="logout-box__button" onClick={submitBtnPressed}>保存</Button>
            </Box>
            <Backdrop open={progress} sx={{ p: "12px" }}>
                <CircularProgress color="success" />
            </Backdrop>
        </main>
    )
}

export default Profile
