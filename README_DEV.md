# PLATEAU　TANGIBLE アプリ

**※Firebaseのプロジェクトの設定方法やローカルでの環境構築方法の詳細はFirebaseのドキュメントを[参照](https://firebase.google.com/docs?hl=ja)してください。**

## 動作環境

### Web
- Webブラウザ
- ネットワーク接続必須

### Tangible
- Raspberry pi

---

## システム構成

### フロントサイドアプリ
- Web フレームワーク：React.js (ver18.2.0)
- 3D 対応ライブラリ：Three.js (ver0.158.0)

### バックエンドアプリ（SPA）
- Firebase Project
  - Authentication
  - Firestore Database
  - Cloud Storage
  - Cloud Function

---

### データモデル
[こちら](./DATAMODEL.md)を参照

### API仕様
[こちら](./API.md)を参照

---

### Firebase Storageをlocalhostで使う方法
- cors設定で弾かれるため、cors.jsonを作成する
```
[
  {
    "origin": ["http://localhost:5173", "https://********.firebaseapp.com", "https://********.web.app"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```
- cors.jsonを作成したフォルダ（基本はプロジェクトのルート）にて、gsutlコマンドを実行
```
gsutil cors set cors.json gs://********.appspot.com
```

### Firebase Functionの注意点

#### Puppeteer設定
- 国土地理院の画像を生成するためにFunction側でosm-static-mapsというライブラリを利用しているが、このライブラリはpuppeteerというライブラリを利用している  
このpuppeteerはv19以降でかなり破壊的な変更が加えられ、osm-static-mapsの最新版では対応できていない  
そのため、osm-static-mapsの[githubページ](https://github.com/jperelli/osm-static-maps)からソースファイルを直接ダウンロードし、Function内に直接追加している(functions/third_party/osm/)
- PuppeteerをCloud functionにて使用する方法は[ここ](https://ths-net.co.jp/shopify_blog/puppeteer/)や[ここ](https://www.chikach.net/category/useful/puppeteer-v19-cloud-functions-workaround/)が参考になる

1. ```.puppeteerrc.cjs```の追加
```
const {join} = require('path');
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
```
<br/>

2. puppeteerをすでにインストールしていれば一度アンインストールし、再度インストールする

<br/>

3. ```firebase.json.```に追記
```
{
  "functions": [
    {
      "ignore": [
        ".cache", // これを追記
        ...
      ],
      ...
    }
  ],
  ...
}
```
- デプロイ時にChromium本体をアプロードしないため。そうしないと「パッケージが大きすぎるためデプロイできません」等のエラーがでる

<br/>

4. ```package.json```(function側)に追記
```
{
  "scripts": {
    "postinstall": "node node_modules/puppeteer/install.js", // これを追記
    ...
  },
  ...
}
```  
- Cloud Functionsではデプロイ後の```npm install```時にChromiumが自動的にインストールされないので、postinstallでインストールスクリプトを実行

### Aruco マーカー
- 予め0から120番までのマーカー画像をpublic/arucoに用意  
こちらの[サイト](https://github.com/okalachev/arucogen)を参照