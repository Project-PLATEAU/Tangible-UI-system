import Box from '@mui/material/Box';
import Button from "@mui/material/Button";
import TextField from '@mui/material/TextField';
import { Link } from 'react-router-dom'
import React from "react";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

function ForgetPassword() {
    return (
        <React.Fragment>
            <main className="main -logout">
                <Box className="logout-box">
                    <h2 className="logout-box__heading">パスワードを忘れた方</h2>
                    <p className="logout-box__text">パスワードを忘れ方はメールアドレスを入力して「送信」ボタンを押してください。仮のパスワードをお送りします。</p>
                    <Box className="logout-box__list">
                        <TextField
                            id="email"
                            type="email"
                            autoComplete="current-email"
                            label="メールアドレス"
                            variant="standard"
                            className="logout-box__item"
                            fullWidth
                        />
                    </Box>
                    <ul className="logout-box__links">
                        <li className="logout-box__linksItem">
                            <Link to="/login" className="logout-box__linksLink">
                                <ArrowForwardIosIcon className="icon logout-box__linksIcon" />
                                ログイン
                            </Link>
                        </li>
                        <li className="logout-box__linksItem">
                            <Link to="/sign-up" className="logout-box__linksLink">
                                <ArrowForwardIosIcon className="icon logout-box__linksIcon" />
                                新規ID登録
                            </Link>
                        </li>
                    </ul>
                    <Button type="submit" variant="contained" color="primary" className="logout-box__button">送信</Button>
                </Box>
            </main>
        </React.Fragment>
    )
}

export default ForgetPassword
