# アプリのデータモデル

## Firestore Database のコレクション定義

---

### **buildings**

- 建物。一般建築物。アプリ上不変データ

| 項目            | field     | type                | 必須 |
| --------------- | --------- | ------------------- | ---- |
| id              | id        | ハッシュ値（gmlID） | ✓    |
| 建物 ID         | bldgID    | string              | ✓    |
| 緯度経度        | geopoint  | geopoint            | ✓    |
| 高度            | altitude  | number              | ✓    |
| geohash※1       | geohash   | geohash             | ✓    |
| lod0footprint※2 | footprint | array               | ✓    |
| 建物高さ        | height    | number              | ✓    |
| 登録日          | created   | timestamp           | ✓    |
| 更新日          | modified  | timestamp           | ✓    |

※1: firebase のジオクエリ用の拡張機能で使用。

※2: {latitude: number, longitude: number, altitude: number}の array として定義。

<br />
<br />

### **furnitures**

- アプリ上不変データ

| 項目             | field     | type         | 必須 |
| ---------------- | --------- | ------------ | ---- |
| id               | id        | ハッシュ値※1 | ✓    |
| 名称             | name      | string       | ✓    |
| ユニットタイプ   | type      | string※2     | ✓    |
| オブジェクト URL | objName   | string※3     | ✓    |
| サムネイル URL   | thumbName | string※4     | ✓    |
| 登録日           | created   | timestamp    | ✓    |

※1: frnID データベースの自動発番  
※2: facility とか、car とか（任意に設定してよい）  
※3: .fbx ファイルのパス（Firebase Storage にアップロードしておく）  
※4: サムネイル画像のパス（Firebase Storage にアップロードしておくと良い）

<br />
<br />

### **specials**

- アプリ上不変データ。特殊駒枠。

| 項目     | field | type                | 必須 |
| -------- | ----- | ------------------- | ---- |
| id       | id    | ユニーク            | ✓    |
| 名称     | name  | string              | ✓    |
| 駒タイプ | type  | camera or special※1 | ✓    |
| 内容     | body  | object※2            | ✓    |

※1: 現状カメラと特殊駒のみ  
※2: カメラの場合は以下

```
{
  mode : "human" | "drone" | "heli",
  angle: number, // 上下角度
  view: number, // カメラ視野角
  height: number, // 高度
}
```

<br />
<br />

### **tangibles**

- タンジブルの箱。ラズパイのキーとメタデータは不変
- 生データがラズパイ側から送られる。
- **area**の tangibleID から生データを呼び出す予定。

| 項目                   | field         | type       | 必須 |
| ---------------------- | ------------- | ---------- | ---- |
| id                     | id            | ハッシュ値 | ✓    |
| 登録日                 | created       | timestamp  | ✓    |
| 更新日                 | modified      | timestamp  | ✓    |
| 生データ               | rawData       | object※1   | -    |
| エリアデータ※2         | area          | object※3   | ✓    |
| 稼働状態※4             | active        | boolean    | ✓    |
| カメラ画像の横幅       | width         | number     | ✓    |
| カメラ画像の縦幅       | height        | number     | ✓    |
| ディスプレイの実測値※5 | meterPerPixel | number     | ✓    |

※1: ラズパイから送られてきた生データ。現在地に当たる。数秒間隔なので履歴としてすべてのデータを残すことはしない?生データではなく、座標変換（緯度経度）までしてしまうか？  
※2: このタンジブルが現在どのエリアを繁栄しているか。アプリ側で area と紐づけるときに更新される  
※3:紐づけ情報。rotation は実装未定。map は中心座標と zoom レベルで表示が決定されるため。

```
{
  workspaceID: number,
  areaID: number
  center: { /* center?  */
    lat: number,
    lng: number
  },
  zoom: number,
  rotation?: number
}
```

※4:稼働状態。ラズパイ側から API で activate してからデータを送信する。アプリ側では`active=true`であれば稼働中と判断する  
※5:ディスプレイの実測値。１ピクセルあたりのメートル数

<br />
<br />

### **users**

| 項目             | field       | type         | 必須 |
| ---------------- | ----------- | ------------ | ---- |
| id               | id          | ハッシュ値※1 | ✓    |
| 表示名           | displayName | string       | ✓    |
| プロフィール写真 | profile     | string※2     | -    |
| 登録日           | created     | timestamp    | ✓    |
| 変更日           | modified    | timestamp    | ✓    |

※1: firebase auth で登録されたハッシュ値。  
※2: 画像ファイル名  
<br />
<br />

### **workspaces**

| 項目             | field       | type       | 必須 |
| ---------------- | ----------- | ---------- | ---- |
| id               | id          | ハッシュ値 | ✓    |
| 表示名           | title       | string     | ✓    |
| 説明             | description | string     | ✓    |
| オーガナイザ     | organizer   | string     | ✓    |
| 登録日           | created     | timestamp  | ✓    |
| 変更日           | modified    | timestamp  | ✓    |
| 検討範囲         | areas       | collection | ✓    |
| スナップショット | snapshots   | collection | -    |

<br />
<br />

### **workspaces.areas**

- 検討範囲オブジェクト

| 項目          | field      | type       | 必須 |
| ------------- | ---------- | ---------- | ---- |
| id            | id         | ハッシュ値 | ✓    |
| タンジブル ID | tangibleID | string     | ✓    |
| タイトル      | title      | string     | ✓    |
| 範囲          | area       | object※1   | ✓    |
| 登録日        | created    | timestamp  | ✓    |
| 変更日        | modified   | timestamp  | ✓    |
| 配置駒        | markers    | collection | -    |

※1: geohash を入れる？zoom と center が決まるとタンジブル側のサイズと解像度の制限で範囲は決定されるため、NE, SW は計算可能

```
{
  NE: { /* North East */
    lat: number,
    lon: number
  },
  SW: { /* South West */
    lat: number,
    lon: number
  },
  center: {
    lat: number,
    lng: number
  },
  zoom: number,
  rotation?: number,
  map?: string // 国土地理院のデータより作成したエリア範囲画像ファイル名
  unity?: string // Unityで作成したエリア範囲画像ファイル名
}
```

<br />
<br />

### **workspaces.areas.markers**

- **workspaces.snapshots.areas.markers**と同じではない（あくまで選択しただけで配置してるかは未定だから）。

| 項目            | field    | type       | 必須 |
| --------------- | -------- | ---------- | ---- |
| id              | id       | ハッシュ値 | ✓    |
| マーカー ID     | markerID | string※1   | ✓    |
| マーカータイプ  | type     | string※2   | ✓    |
| オブジェクト ID | objID    | string※3   | ✓    |
| コメント        | comment  | string     | ✓    |
| 登録日          | created  | timestamp  | ✓    |
| 更新日          | modified | timestamp  | ✓    |

※1: ユニット番号。"01"-"99"(ユニットである必要はないかも)  
※2: "furniture" | "building" | "special"  
※3: type 次第。ビルであれば**buildings**コレクションの gmlID。ファニチャーであれば**furnitures**コレクションの frnID。スペシャルは camera_01 など ID で何かを判別できるもの

<br />
<br />

### **workspaces.snapshots**

- セーブデータ

| 項目               | field      | type       | 必須 |
| ------------------ | ---------- | ---------- | ---- |
| id                 | id         | ハッシュ値 | ✓    |
| 保存日             | created    | timestamp  | ✓    |
| スクリーンショット | screenshot | string※1   | ✓    |
| タイトル           | title      | string     | -    |
| コメント           | comment    | string     | -    |
| カメラ位置         | camera     | object※2   | ✓    |
| 検討範囲           | areas※3    | collection | ✓    |

※1: 画像ファイル名。URL は id などから生成。unity など外部からの場合も同様  
※2: VR 用のカメラ座標

```
{
  position: {
    lat: number,
    lng: number,
    alt: number
  },
  target: {
    lat: number,
    lng: number,
    alt: number
  }
}
```

※3: エリア情報。ドキュメント ID ごとコピー

<br />
<br />

### **workspaces.snapshots.areas**

- 検討範囲オブジェクト
- 基本データは**workspaces.area**のコピー

| 項目          | field      | type       | 必須 |
| ------------- | ---------- | ---------- | ---- |
| id            | id         | ハッシュ値 | ✓    |
| タンジブル ID | tangibleID | string     | ✓    |
| タイトル      | title      | string     | ✓    |
| 範囲          | area       | object     | ✓    |
| 登録日        | created    | timestamp  | ✓    |
| 変更日        | modified   | timestamp  | ✓    |
| 配置駒        | markers※1  | collection | -    |

※1: 配置されている駒のみ。座標情報を含む

<br />
<br />

### **workspaces.snapshots.areas.markers**

- **workspaces.areas.markers**と完全な同一構造ではない。
- **workspaces.areas.markers**で登録だけして配置していない駒は記録されない。

| 項目            | field    | type       | 必須 |
| --------------- | -------- | ---------- | ---- |
| id              | id       | ハッシュ値 | ✓    |
| マーカー ID     | markerID | string     | ✓    |
| タイプ          | type     | string     | ✓    |
| オブジェクト ID | objID    | string     | ✓    |
| 登録日          | created  | timestamp  | ✓    |
| 更新日          | modified | timestamp  | ✓    |
| 座標            | position | object※1   | ✓    |
| 方向            | rotation | number※2   | ✓    |

※1: 緯度経度座標情報

```
{
  lat: number,
  lng: number,
  alt?: number
}
```

※4: 北を 0 ラジアンとしたマーカーの向き情報

<br />
<br />

---

## 注意事項

- アプリ上でエリアやスナップショットを削除した場合、ドキュメントは削除されるが配下のサブコレクションは削除されない。アプリを使う上では気にならない。

---

## セキュリティ設定

- 本プロジェクトでは Firebase のダッシュボード上で設定。  
  Firestore Database, Storege のページからルール → ルールの編集を選択し、以下のコードを貼り付ける。
  <br />
  <br />

### **Firestore Database のルール**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /buildings/{building} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /users/{userId}/{user=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

<br />
<br />

### **Storage のルール**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tags/{tag=**} {
      allow read;
      allow write: if request.auth != null;
    }
    match /users/{userId}/{imgs=**} {
      allow read;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

<br />
<br />

---

## PLATEAU モデルの組み込み手順

### **①gml ファイルより必要なデータを抽出**

例:建物の場合
`bldg:Building`要素内より、次の属性を抽出。

```
- gml:id ※1
- uro:buildingID ※2
- bldg:lod1Solid※3
```

※1: ユニークであるもの。

※2: bldgID 等。"bldg:consistsOfBuildingPart"を含む場合は１つの bldgID に対し、複数の gmlID が生まれるため、この値はユニークではない。また`<gen:stringAttribute name="建物ID">`の値である可能性もある。

※3: "bldg:lod0FootPrint"、"bldg:lod0RoofEdge"ではなく"bldg:lod1Solid"より底面、高さを抽出し、それを footprint と高さみなす。
<br />
<br />

### **②JSON 形式に整形**

posList は以下のように配列に変換。

```
{ latitude: Number, longitude: Number, altitude: Number}
```

またジオクエリに対応するためオブジェクトの中心座標を計算（平均値）。

```
# 建物オブジェクト
{
      gmlID: string,
      bldgID: string,
      height: number,
      footprint: [{
      	latitude: number,
      	longitude: number,
      	altitude: number
      }..],
      center: {
      	latitude: number,
      	longitude: number,
      	altitude: number
      }
}
```

<br />
<br />

### **③Firestore に登録**

center は GeoPoint に変換。GeoHash ロジックを使用するのでその情報も付与。
<br />
<br />