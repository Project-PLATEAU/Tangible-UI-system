import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Link } from 'react-router-dom'

function App() {

    return (
        <main className="main">
            <h2 className="logout-box__heading">ログイン前</h2>
            <Link to="/login" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">ログイン</span>
            </Link>
            <br></br>
            <Link to="/login-error" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">ログインエラーパターン</span>
            </Link>
            <br></br>
            <Link to="/sign-up" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">サインアップ</span>
            </Link>
            <br></br>
            <Link to="/sign-up-error" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">サインアップエラーパターン</span>
            </Link>
            <br></br>
            <Link to="/profile" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">プロフィール編集</span>
            </Link>

            <h2 className="logout-box__heading">ログイン後</h2>
            <Link to="/list" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">ワークスペース</span>
            </Link>
            <br></br>
            <Link to="/list-empty" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">ワークスペース空パターン</span>
            </Link>
            <br></br>
            <Link to="/detail" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">ワークスペース詳細</span>
            </Link>
            <br></br>
            <Link to="/detail-empty" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">ワークスペース詳細空パターン・停止中パターン</span>
            </Link>
            <br></br>
            <Link to="/new" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">新規ワークスペース</span>
            </Link>
            <br></br>
            <Link to="/confirm" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">新規ワークスペース範囲確定</span>
            </Link>
            <br></br>
            <Link to="/forget-password" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">パスワードリマインダ</span>
            </Link>
            <br></br>
            <Link to="/full" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">全画面（見出しなし）</span>
            </Link>
            <br></br>
            <Link to="/full02" className="logout-box__link" target="_blank">
                <CheckCircleIcon className="icon -green logout-box__linkIcon" />
                <span className="logout-box__linkText">全画面_1（見出しあり）</span>
            </Link>
        </main>
    )
}

export default App
