import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { RecoilRoot } from "recoil";
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

// import App from './App.tsx'
import './scss/common.scss'
import Header from './components/modules/Header'
import Detail from "./detail";
import Full01 from './full01';
import Full02 from "./full02";
import List from './list.tsx'
import Login from './login.tsx'
import New from "./new";
import Profile from "./profile";
import SignUp from './sign-up.tsx'
import { useAuth } from './utils/Authenticator'
// import ForgetPassword from "./forget-password";

const theme = createTheme({
    palette: {
        primary: {
            main: '#5F65B2'
        },
        text: {
            primary: '#4B4B4B'
        }
    },
    typography: {
        fontFamily: ["Hiragino Kaku Gothic ProN", "Hiragino Sans", "Meiryo", "sans-serif"].join(','),
        fontSize: 16
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    minWidth: 96,
                    height: 40,
                    boxShadow: 'none',
                    "&:hover": {
                        boxShadow: 'none',
                    }
                },
                containedSecondary: {
                    background: '#378CEF',
                    "&:hover": {
                        background: '#0F1546'
                    }
                },
                containedInfo: {
                    background: '#697084',
                    "&:hover": {
                        background: '#2D3139'
                    }
                },
                outlined: {
                    color: '#4B4B4B',
                    borderColor: '#C6C6C6',
                    borderWidth: 2,
                    "&:hover": {
                        borderWidth: 2,
                    }
                },
            },
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    width: 38,
                    height: 38,
                }
            }
        },
        // MuiBackdrop: {
        //     styleOverrides: {
        //         root: {
        //             background: 'rgba(0, 0, 0, 0)'
        //         }
        //     }
        // },
        MuiInput: {
            styleOverrides: {
                root: {
                    display: 'flex',
                    fontSize: '1.4rem',
                }
            }
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    fontSize: '1.8rem',
                    fontWeight: 'bold'
                },
                textColorPrimary: {
                    "&.Mui-selected": {
                        color: '#333333'
                    }
                }
            }
        },
        MuiSwitch: {
            styleOverrides: {
                root: {
                  width: "74px"
                },
                colorPrimary: {
                    "&.Mui-checked": {
                        color: "#fff"
                    }
                },
                track: {
                    background: '#249EB3',
                    ".Mui-checked.Mui-checked + &": {
                        background: '#249EB3',
                        opacity: 1
                    }
                }
            }
        }
    }
});

const AppInit = () => {

    if (useAuth()) {
        return (
            <p>Loading...</p>
        );
    }

    return (
        <>
            <BrowserRouter>
                <Header/>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/sign-up" element={<SignUp />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/list" element={<List />} />
                    <Route path="/full/:id?" element={<Full01 />} />
                    <Route path="/full02/:id?/:snapId?" element={<Full02 />} />
                    {/* <Route path="/forget-password" element={<ForgetPassword />} /> */}
                    <Route path="/new/:id?" element={<New />} />
                    <Route path="/detail/:id?" element={<Detail />} />
                </Routes>
            </BrowserRouter>
        </>
    )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* <React.StrictMode> */}
        <RecoilRoot>
            <AppInit />
        </RecoilRoot>
        {/* </React.StrictMode> */}
    </ThemeProvider>
)
