import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilValue } from "recoil";

import logo from '../../images/common/logo.svg'
import '../../scss/layout/_header.scss'

import { logout, useUser } from "../../utils/Authenticator"
import { Photo } from "../../utils/models/Photo";
import { UserDataAtom, UserUtils } from "../../utils/UserUtils";
import { UserAvatar } from './avatar-user';

interface Props {
    /**
     * Injected by the documentation to work in an iframe.
     * You won't need it on your project.
     */
    window?: () => Window;
}

function Header(props: Props) {
    const { window } = props;
    const [open, setOpen] = useState(false);
    const [photo, setPhoto] = useState<Photo | undefined>(undefined);

    const userData = useRecoilValue(UserDataAtom);
    const user = useUser();
    const location = useLocation();
    const router = useNavigate();

    useEffect(() => {
        loadUserData();
    }, [userData]);

    const loadUserData = async () => {
        if (!photo) {
          const p = await UserUtils.getProfileImage(userData);
          setPhoto(p);
        }
    };

    // userDataはstateのdefaultが最初に設定されるのでダメ。
    // firebase側でsaveしてあるuserオブジェクトの存在でloginを決める
    useEffect(() => {
        // if (location.pathname === "/") {
        //     router("/login");
        //     return;
        // }
        if (user) {
            // console.log(location.pathname);
            if (location.pathname === "/" || location.pathname === "/sign-up") {
                router("/list");
            }
        } else {
            if (location.pathname !== "/") {
                if (location.pathname !== "/sign-up") {
                    router("/")
                }
            }
        }
    }, [user])

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };
    const container = window !== undefined ? () => window().document.body : undefined;

    const logoutPressed = () => {
        logout().catch((error) => console.error(error));
        setOpen(false);
    }

    const logoBtnPressed = () => {
        router("/list");
        setOpen(false);
    }

    return (
        <>
            <AppBar position="fixed" className="header">
            {userData.isLogin ? 
                <>
                    <Button onClick={() => logoBtnPressed()} className="header__logo">
                        <img src={logo} alt="Tangible IF" width={159} height={37} decoding="async" />
                    </Button>
                    <Button onClick={toggleDrawer(true)} className="header__avatar avatar">
                        <UserAvatar size={60} photo={photo} initial={true} />
                    </Button>
                </> :
                <>
                    <h1 className="header__logo">
                        <img src={logo} alt="Tangible IF" width={159} height={37} decoding="async" />
                    </h1>
                    <Avatar
                    { ...UserUtils.stringAvatar(userData.displayName !== "" ? userData.displayName : "n", 40)}
                    />
                </>
            }
            </AppBar>
            <SwipeableDrawer
                className="drawer"
                container={container}
                anchor="right"
                open={open}
                onClose={toggleDrawer(false)}
                onOpen={toggleDrawer(true)}
                swipeAreaWidth={0}
                disableSwipeToOpen={false}
                ModalProps={{
                    keepMounted: true,
                }}
            >
                <Box className="drawer__inner">
                    <Box className="drawer-header">
                        <Button onClick={toggleDrawer(false)} className='avatar drawer-header__avatar' >
                            <UserAvatar size={40} photo={photo} initial={true} />
                        </Button>
                        <Typography className="drawer-header__text">{userData.displayName}</Typography>
                    </Box>
                    <nav className="drawer-nav">
                        <List className="drawer-nav__list">
                            <ListItem disablePadding className="drawer-nav__item">
                                <ListItemButton className="drawer-nav__link" href="/list">
                                    <ListItemIcon>
                                        <AddCircleOutlineIcon className="icon -white" />
                                    </ListItemIcon>
                                    <ListItemText primary="トップ" className="drawer-nav__text" />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding className="drawer-nav__item">
                                <ListItemButton className="drawer-nav__link" href="/new">
                                    <ListItemIcon>
                                        <AddCircleOutlineIcon className="icon -white" />
                                    </ListItemIcon>
                                    <ListItemText primary="新規ワークスペース作成" className="drawer-nav__text" />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding className="drawer-nav__item">
                                <ListItemButton className="drawer-nav__link" href="/profile">
                                    <ListItemIcon>
                                        <AccountCircleIcon className="icon -white" />
                                    </ListItemIcon>
                                    <ListItemText primary="プロフィール編集" className="drawer-nav__text" />
                                </ListItemButton>
                            </ListItem>
                        </List>
                    </nav>
                    <Button variant="contained" color="primary" onClick={logoutPressed} className="drawer__logout">ログアウト</Button>
                </Box>
            </SwipeableDrawer>
        </>
    );
}

export default Header