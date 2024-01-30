import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useSetRecoilState } from "recoil";

import { UserAvatar } from "./components/modules/avatar-user";
import { updateUserData } from "./utils/firebase/firebase";
import { Photo } from "./utils/models/Photo";
import { UserDataAtom, refreshUserData } from "./utils/UserUtils";

import { auth } from "./utils/firebase/init";

function SignUp() {
    const setUserData = useSetRecoilState(UserDataAtom);
    const [disableFlag, setDisableFlag] = useState(true);

    const [photo, setPhoto] = useState<Photo | undefined>(undefined);
    const [formDisplayName, setFormDisplayName] = useState<string>("");
    const [formEmail, setFormEmail] = useState<string>("")
    const [formPassword, setFormPassword] = useState<string>("")
    const [formConfirm, setFormConfirm] = useState<string>("")

    const [progress, setProgress] = useState(false);
    const [errMode, setErrMode] = useState({ flag: false, message: "" });

    const formChange = (type: string, value: string) => {
        if (type === "email") {
            setFormEmail(value);
        } else if (type === "password") {
            setFormPassword(value);
        } else if (type === "password_confirm") {
            setFormConfirm(value);
        } else if (type === "name") {
            setFormDisplayName(value);
        }
        validationCheck();
    };
    const validationCheck = () => {
        if (formEmail.split("@").length !== 2 || formEmail.split(".").length < 2) {
            setDisableFlag(true);
            return;
        }
        if (formPassword.length < 8) {
            setDisableFlag(true);
            return;
        }
        if (formPassword !== formConfirm) {
            setDisableFlag(true);
            return;
        }
        setDisableFlag(false);
    }

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
            await createUserWithEmailAndPassword(auth, formEmail, formPassword);
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
                    message: "不明なエラーが発生しました。後ほどやり直してください。(2)",
                });
            }
          }
          setProgress(false);
        }
    };

    const passWordValidation = () => {
        if (formPassword.length >= 8 && formPassword === formConfirm) {
            return true;
        }
        return false;
    };
 
    return (
        <main className="main -logout">
            <Box className="logout-box" >
                <h2 className="logout-box__heading">サインアップ</h2>
                <IconButton aria-label="写真アップロード" component="label" className="file">
                    <UserAvatar photo={photo} size={144} initial={true}/>
                    <PhotoCameraIcon className="icon file__icon" />
                    <input hidden accept="image/*" type="file" onChange={inputChange}/>
                </IconButton>
                <Box className="logout-box__list">
                    <TextField
                        type="email"
                        autoComplete="current-email"
                        label="メールアドレス"
                        variant="standard"
                        className="logout-box__item"
                        onChange={(e) => formChange("email", e.target.value)}
                        value={formEmail}
                        fullWidth
                    />
                    <TextField
                        type="password"
                        label="パスワード"
                        variant="standard"
                        value={formPassword}
                        helperText="８文字以上で設定してください"
                        onChange={(e) => formChange("password", e.target.value)}
                        className="logout-box__item"
                        fullWidth
                    />
                    <TextField
                        type="password"
                        autoComplete="current-password"
                        label="パスワード（確認用）"
                        variant="standard"
                        value={formConfirm}
                        
                        onChange={(e) => formChange("password_confirm", e.target.value)}
                        className="logout-box__item"
                        fullWidth
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="start">
                                    { passWordValidation() ?
                                        <CheckCircleIcon className="icon -green" /> :
                                        <ErrorOutlineIcon className="icon -red" />
                                    }
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        label="Display name"
                        variant="standard"
                        className="logout-box__item"
                        value={formDisplayName}
                        fullWidth
                        onChange={ e => formChange("name", e.target.value) }
                    />
                </Box>
                <p className="logout-box__links">
                    <Link to="/login" className="logout-box__linksLink">
                        <ArrowForwardIosIcon className="icon logout-box__linksIcon" />
                        すでにアカウントをお持ちの方
                    </Link>
                </p>
                <Button
                    disabled={disableFlag}
                    variant="contained"
                    color="primary"
                    className="logout-box__button"
                    onClick={submitBtnPressed}
                >
                    送信
                </Button>
                {errMode.flag && (
                <Box sx={{ m: "20px" }} color="error">
                    <p
                    style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#e63b43",
                        textAlign: "center"
                    }}
                    >
                    {errMode.message}
                    </p>
                </Box>
                )}
            </Box>
            <Backdrop open={progress} sx={{ p: '12px' }}>
                <CircularProgress color="success" />
            </Backdrop>
        </main>
    )
}

export default SignUp
