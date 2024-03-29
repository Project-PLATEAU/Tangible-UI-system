# 環境構築手順書

# 1 本書について

本書では、PLATEAU TANGIBLE WEBアプリ（以下「本システム」という。）の利用環境構築手順について記載しています。本システムの構成や仕様の詳細については以下も参考にしてください。

[技術検証レポート](https://www.mlit.go.jp/plateau/file/libraries/doc/xxx.pdf)

# 2 動作環境

本システムの動作環境は以下のとおりです。

#### フロントサイドアプリ

- Web フレームワーク：React.js (ver18.2.0)
- 3D 対応ライブラリ：Three.js (ver0.158.0)

#### バックエンドアプリ（SPA）

- Firebase Project
  - Authentication
  - Firestore Database
  - Cloud Storage
  - Cloud Function


# 3 設定手順

### Firebase の設定

**※Firebase のプロジェクトの設定方法、ローカルでの環境構築方法、仕様方法については Firebase のドキュメントを[参照](https://firebase.google.com/docs?hl=ja)してください。**

#### タンジブル駒の登録

[データモデル](./dataSpec.md)を参考に、タンジブル駒（buildings、furnitures、specials）を登録しておきます。

#### Firebase Storage を localhost で使う際の注意点

- cors 設定で弾かれるため、cors.json を作成します

```
[
  {
    "origin": ["http://localhost:5173", "https://********.firebaseapp.com", "https://********.web.app"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

- cors.json を作成したフォルダ（基本はプロジェクトのルート）にて、gsutl コマンドを実行してください

```
gsutil cors set cors.json gs://********.appspot.com
```

#### Firebase Function の注意点

##### Puppeteer 設定

- 国土地理院の画像を生成するために Function 側で osm-static-maps というライブラリを利用していますが、このライブラリは puppeteer というライブラリを利用しています  
  この puppeteer は v19 以降でかなり破壊的な変更が加えられており、osm-static-maps の最新版では対応できていません  
  そのため、osm-static-maps の[github ページ](https://github.com/jperelli/osm-static-maps)からソースファイルを直接ダウンロードし、Function 内に直接追加しています(functions/third_party/osm/)
- Puppeteer を Cloud function にて使用する方法は[ここ](https://ths-net.co.jp/shopify_blog/puppeteer/)や[ここ](https://www.chikach.net/category/useful/puppeteer-v19-cloud-functions-workaround/)が参考になります

1. `.puppeteerrc.cjs`の追加

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

2. puppeteer をすでにインストールしていれば一度アンインストールし、再度インストール

<br/>

3. `firebase.json.`に追記

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

- デプロイ時に Chromium 本体をアプロードしないため。そうしないと「パッケージが大きすぎるためデプロイできません」等のエラーがでます

<br/>

4. `package.json`(function 側)に追記

```
{
  "scripts": {
    "postinstall": "node node_modules/puppeteer/install.js", // これを追記
    ...
  },
  ...
}
```

- Cloud Functions ではデプロイ後の`npm install`時に Chromium が自動的にインストールされないので、postinstall でインストールスクリプトを実行してください。

### Aruco マーカー

- 予め 0 から 120 番までのマーカー画像を public/aruco に用意しています  
  Aruco マーカーについて、詳しくは、こちらの[サイト](https://github.com/okalachev/arucogen)を参照してください。
