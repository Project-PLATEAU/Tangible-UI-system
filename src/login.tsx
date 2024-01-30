import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box';
import Button from "@mui/material/Button";
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Link } from 'react-router-dom'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useState } from "react";
import { auth } from './utils/firebase/init';

function Login() {
    const [formEmail, setFormEmail] = useState<string>("");
    const [formPassword, setFormPassword] = useState<string>("");
    const [progress, setProgress] = useState(false);
    const [errMode, setErrMode] = useState({ flag: false, message: "" });

    const submitBtnPressed = async () => {
        if (!progress) {
            setProgress(true);
            try {
                await signInWithEmailAndPassword(auth, formEmail, formPassword);
                setErrMode({
                    flag: false,
                    message: "",
                });
            } catch (e) {
                console.log(e)
                let eM = "パスワードまたはメールアドレスが不正です"
                if (e instanceof Error) {
                    if (e.message === "Firebase: Error (auth/wrong-password).") {
                        eM = "パスワードが違います"
                    } else if (e.message === "Firebase: Error (auth/user-not-found).") {
                        eM = "ユーザーが見つかりません"
                    }
                }
                setErrMode({
                    flag: true,
                    message: eM,
                });
            }
            setProgress(false);
        }
    }
    
    const formChange = (type: string, value: string) => {
        if (type === "email") {
            setFormEmail(value);
        } else if (type === "password") {
            setFormPassword(value);
        }
    }
  
    return (
        <main className="main -logout">
            <Box className="logout-box">
                <h2 className="logout-box__heading">ログイン</h2>
                <Box className="logout-box__list">
                    <TextField
                        id="email"
                        type="email"
                        autoComplete="current-email"
                        label="ID"
                        variant="standard"
                        className="logout-box__item"
                        value={formEmail}
                        onChange={(e) => formChange("email", e.target.value)}
                        fullWidth
                    />
                    <TextField
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        label="パスワード"
                        variant="standard"
                        className="logout-box__item"
                        value={formPassword}
                        onChange={(e) => formChange("password", e.target.value)}              
                        fullWidth
                    />
                    {errMode.flag && (
                    <Box sx={{ m: '20px' }} color="error">
                        <p
                        style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#e63b43',
                            textAlign: 'center'
                        }}
                        >
                        {errMode.message}
                        </p>
                    </Box>
                    )}
                </Box>
                <ul className="logout-box__links">
                    {/* <li className="logout-box__linksItem">
                        <Link to="/forget-password" className="logout-box__linksLink">
                            <ArrowForwardIosIcon className="icon logout-box__linksIcon" />
                            パスワードを忘れた
                        </Link>
                    </li> */}
                    <li className="logout-box__linksItem">
                        <Link to="/sign-up" className="logout-box__linksLink">
                            <ArrowForwardIosIcon className="icon logout-box__linksIcon" />
                            新規ID登録
                        </Link>
                    </li>
                </ul>
                <Button variant="contained" color="primary" className="logout-box__button" onClick={submitBtnPressed}>ログイン</Button>
            </Box>
            <Backdrop open={progress} sx={{ p: '12px' }}>
                <CircularProgress color="success" />
            </Backdrop>
        </main>
    )
}

export default Login
