# API 基本仕様


## 基本呼び出しURL
```
curl -X GET \
-H 'Authorization: Bearer *** API KEY ***' 'https://*** defined by project ***/'
```
<br />
<br />

## API List
#### **/buildings/(:gmlID)** 
<br/>

#### **/furnitures/(:frnID)** 
<br/>

#### **/tangibles/post**
#### **/tangibles/(:tangibleId)/**
#### **/tangibles/(:tangibleId)/activate**
#### **/tangibles/(:tangibleId)/inactivate**
#### **/tangibles/(:tangibleId)/map**
#### **/tangibles/(:tangibleId)/footprints/buildings**
<br/>

#### **/workspaces/(:wsID)**
#### **/workspaces/(:wsID)/snapshots** 
#### **/workspaces/(:wsID)/snapshots/(:snapID)** 
#### **/workspaces/(:wsID)/tangible** 
#### **/workspaces/(:wsID)/areas/(:areaID)/unitymap**
<br/>

## Building

### **/buildings/(:gmlID)** 
| メソッド | 認証   |
| -------- | ------ |
| GET   | 必要 |
- 単一(gmlID)建物情報を取得
```
{
  "gmlID": "bldg_******",
  "footprint": [
    {
      "altitude": ***,
      "latitude": ***,
      "longitude": ***
    },
    {
      "altitude": ***,
      "latitude": ***,
      "longitude": ***
    },
    ...
  ],
  "center": {
    "altitude": ***,
    "latitude": ***,
    "longitude": ***
  },
  "bldgID": "14100-bldg-******",
  "created": {
    "_seconds": 1684318649,
    "_nanoseconds": 126000000
  },
  "modified": {
    "_seconds": 1684318649,
    "_nanoseconds": 126000000
  },
  "height": ******,
  "radius": ******
}
```

<br />
<br />

## Furniture

### **/furnitures/(:frnID)** 
| メソッド | 認証   |
| -------- | ------ |
| GET   | 必要 |
- 単一(frnID)オブジェクト情報を取得
```
{
  "objName": "Fairlady_Z.fbx",
  "name": "Fairlady_Z",
  "thumbnail": "Nissan_Z_Proto_2020.png",
  "type": "car",
  "created": {
    "_seconds": 1690383600,
    "_nanoseconds": 271000000
  },
  "thumbUrl": "https://firebasestorage.googleapis.com/v0/b/******.appspot.com/o/frn%2Fcar%2FNissan_Z_Proto_2020.png?alt=media&token=******",
  "objUrl": "https://firebasestorage.googleapis.com/v0/b/******.appspot.com/o/frn%2Fcar%2FFairlady_Z.fbx?alt=media&token=******"
}
```

<br/>
<br/>

## Tangible

### **/tangibles/post**
| メソッド | 認証   |
| -------- | ------ |
| POST     | 必要 |
- 対象tangibleから最新データを投稿
- 対象tangibleがactiveでないとエラー。**taigibles/(:tangibleId)/activate**を先に呼び出す必要がある

```
Body
{
    "unitID": "100000005e387919",
    "timestump": "yyyy-mm-ddThh:mm",
    "data":
    [
        {
            "markerID": 1,
            "coordinates": {
                "x1":1182.0,
                "x2":1381.0,
                "x3":1373.0,
                "x4":1172.0,
                "y1":673.0,
                "y2":684.0,
                "y3":888.0,
                "y4":876.0,
                "cx":1277.0,
                "cy":780.25
            }
        },
        {
            "markerID": 2,
            "coordinates": {
                "x1":1182.0,
                "x2":1381.0,
                "x3":1373.0,
                "x4":1172.0,
                "y1":673.0,
                "y2":684.0,
                "y3":888.0,
                "y4":876.0,
                "cx":1277.0,
                "cy":780.25
            },
        },
        ...
    ]
}
```
<br />
<br />

### **/tangibles/(:tangibleId)/**
| メソッド | 認証   |
| -------- | ------ |
| GET      | 必要 |
- 対象tangibleの最新データを取得

<br />
<br />

### **/tangibles/(:tangibleId)/activate**
| メソッド | 認証   |
| -------- | ------ |
| GET   | 必要 |
- 対象tangibleを稼働状態にする**tangibles/post**で、データをPOSTできるようになる
<br />
<br />

### **/tangibles/(:tangibleId)/inactivate**
| メソッド | 認証   |
| -------- | ------ |
| GET   | 必要 |
- 対象tangibleを停止状態にする
<br />
<br />

### **/tangibles/(:tangibleId)/map**
| メソッド | 認証   |
| -------- | ------ |
| GET   | 必要 |
- 国土地理院の画像データURLを取得(storageに保存している)
- URLはパブリックなものなのでそこから画像をダウンロードする
- unity画像がある場合はunity画像のurlを返却  

```
{
  "message": "OK",
  "url": "https://firebasestorage.googleapis.com/v0/b/******.appspot.com/o/******.png?alt=media&token=******"
}
```

<br />
<br />

### **/tangibles/(:tangibleId)/footprints/buildings**
| メソッド | 認証   |
| -------- | ------ |
| GET   | 必要 |
- tangibleユニットの表示範囲にいるplateau建物を取得する  
- マーカーではない。マーカーとして選択されているものも含まれている。
```
[
  {
    "gmlID": "bldg_******",
    "footprint": [
      {
        "latitude": 35.-----,
        "longitude": 139.-----,
        "altitude": 3.-----
      },
      {
        "latitude": 35.-----,
        "longitude": 139.-----,
        "altitude": 3.-----
      },
      ...
    ],
    "center": {
      "latitude": 35.-----,
      "longitude": 139.-----,
      "altitude": 3.-----
    },
    "bldgID": "14100-bldg-*******",
    "created": {
      "_seconds": 1686895725,
      "_nanoseconds": 740000000
    },
    "modified": {
      "_seconds": 1686895725,
      "_nanoseconds": 740000000
    },
    "height": ***
  },
  ...
]
```

<br />
<br />



## Workspace
### **/workspaces/(:wsID)**
| メソッド | 認証   |
| -------- | ------ |
| GET | 必要 |

- ワークスペースの基本情報を取得（エリア、マーカー）
- マーカーの本体情報や座標情報は含まない  
（座標は最新のスナップショットであり、それは別のAPI）
```
{
  "created": {
    "_seconds": 1689658954,
    "_nanoseconds": 386000000
  },
  "description": "ワークスペース詳細",
  "title": "新規ワークスペース",
  "organizer": "******",
  "modified": {
    "_seconds": 1693790275,
    "_nanoseconds": 819000000
  },
  "areas": [
    {
      "area": {
        "SW": {
          "lng": 139.---,
          "lat": 35.---
        },
        "NE": {
          "lng": 139.---,
          "lat": 35.---
        },
        "center": {
          "lng": 139.---,
          "lat": 35.---
        },
        "rotation": 0,
        "zoom": 20.14,
        "map": "map_******.png"
      },
      "created": {
        "_seconds": 1693183069,
        "_nanoseconds": 659000000
      },
      "title": "area04",
      "tangibleID": "************",
      "modified": {
        "_seconds": 1693790275,
        "_nanoseconds": 500000000
      },
      "docId": "1CzDqsPrBpHHs7K70Kqc",
      "markers": [
        {
          "objID": "******",
          "comment": "",
          "type": "furniture",
          "markerID": "02",
          "created": {
            "_seconds": 1693790275,
            "_nanoseconds": 719000000
          },
          "modified": {
            "_seconds": 1693790275,
            "_nanoseconds": 719000000
          },
          "docId": "02"
        },
        {
          "created": {
            "_seconds": 1693183120,
            "_nanoseconds": 989000000
          },
          "objID": "bldg_******",
          "comment": "",
          "type": "building",
          "markerID": "00",
          "modified": {
            "_seconds": 1693790275,
            "_nanoseconds": 719000000
          },
          "docId": "00"
        }
      ]
    },
    ...
  ]
}
```

<br/>
<br/>


### **/workspaces/(:wsID)/snapshots** 
| メソッド | 認証   |
| -------- | ------ |
| GET/POST | 必要 |

#### GET

- ワークスペース(wsID)のスナップショットのリストを取得
- マーカー情報は含まれない  

```
[
  {
    "comment": "つくれているかな？",
    "screenshot": "snapshot_2023-08-03-17-36-52.png",
    "camera": {
      "position": {
        "lng": 139.***,
        "alt": 255.***,
        "lat": 35.***
      },
      "target": {
        "lng": 139.***,
        "alt": 96.***,
        "lat": 35.***
      }
    },
    "title": "スナップショットつくってみた",
    "unityimage": "",
    "created": {
      "_seconds": 1691051813,
      "_nanoseconds": 570000000
    },
    "docId": "2023-08-03-17-36-52",
    "screenUrl": "https://firebasestorage.googleapis.com/v0/b/********.appspot.com/o/workspaces%2F******%2Fsnapshot_2023-08-03-17-36-52.png?alt=media&token=******"
  },
  ...
]
```

<br />
<br />


#### POST

- スナップショットを作成する
- タンジブルユニットが最低１つ起動中であることが条件

| パラメータ | 内容   | 必須 |
| -------- | ------ | --- |
| file | 画像ファイル | ✓ |
| title | スナップショットタイトル | ✓ |
| comment | スナップショットコメント | - |
| camera | ディスプレイカメラの情報※1 | ✓ |

※1: ```position```はカメラ座標（緯度経度高度）、```target```はカメラ視点座標（緯度経度高度）
```
{
  position: { lat: number, lng: number: alt: number },
  target: { lat: number, lng: number: alt: number }
}
```


```
curl -X POST \
http://***apibase***/workspaces/(:wsId)/snapshots/ \
-H "Authorization: Bearer ***apikey***" \
-F "file=@sample.png"
-F 'title=API Snapshot' \
-F 'comment=comment sample' \
-F 'camera={"position":{"alt":16,"lat":35.***,"lng":139.***},"target":{"alt":3,"lat":35.***,"lng":139.***}}'
```

<br/>
<br/>


### **/workspaces/(:wsID)/snapshots/(:snapID)** 
| メソッド | 認証   |
| -------- | ------ |
| GET   | 必要 |
- ワークスペース(wsID)の単一スナップショット(snapID)の詳細情報を取得
- snapIDを"latest"にすると最新のスナップショット情報を返却
```
{
  "comment": "つくれているかな？",
  "screenshot": "snapshot_2023-08-03-17-36-52.png",
  "camera": {
    "position": {
      "lng": 139.***,
      "alt": 255.***,
      "lat": 35.***
    },
    "target": {
      "lng": 139.***,
      "alt": 96.***,
      "lat": 35.***
    }
  },
  "title": "スナップショットつくってみた",
  "unityimage": "",
  "created": {
    "_seconds": 1691051813,
    "_nanoseconds": 570000000
  },
  "docId": "2023-08-03-17-36-52",
  "screenUrl": "******",
  "areas": [
    {
      "area": {
        "SW": { "lng": ***, "lat": *** },
        "NE": { "lng": ***, "lat": *** },
        "center": { "lng": ***, "lat": *** },
        "rotation": 0,
        "zoom": 18
      },
      "created": {
        "_seconds": 1689658954,
        "_nanoseconds": 471000000
      },
      "title": "area1",
      "tangibleID": "******",
      "modified": {
        "_seconds": 1691051813,
        "_nanoseconds": 625000000
      },
      "docId": "******",
      "markers": [
        {
          "created": {
            "_seconds": 1689658954,
            "_nanoseconds": 556000000
          },
          "rotation": 4.6718208444643565,
          "objID": "bldg_******",
          "comment": "",
          "position": { "lng": ***, "lat": *** },
          "type": "building",
          "bldg": {
            "gmlID": "bldg_******",
            "footprint": [
              {
                "altitude": ***,
                "latitude": ***,
                "longitude": ***
              },
              ...
            ],
            "center": {
              "altitude": ***,
              "latitude": ***,
              "longitude": ***
            },
            "bldgID": "14100-bldg-******",
            "created": {
              "_seconds": 1684318649,
              "_nanoseconds": 126000000
            },
            "modified": {
              "_seconds": 1684318649,
              "_nanoseconds": 126000000
            },
            "height": ******,
            "radius": ******
          }
          "markerID": "02",
          "modified": {
            "_seconds": 1691051813,
            "_nanoseconds": 677000000
          },
          "docId": "02"
        },
        {
          "created": {
            "_seconds": 1689658954,
            "_nanoseconds": 556000000
          },
          "rotation": 4.750831570405878,
          "objID": "******",
          "comment": "",
          "position": { "lng": ***, "lat": *** },
          "type": "furniture",
          "frn": {
            "objName": "Fairlady_Z.fbx",
            "name": "Fairlady_Z",
            "thumbnail": "Nissan_Z_Proto_2020.png",
            "type": "car",
            "created": {
              "_seconds": 1690383600,
              "_nanoseconds": 271000000
            },
            "thumbUrl": "https://*****",
            "objUrl": "https://*****"
          }
          "markerID": "00",
          "modified": {
            "_seconds": 1691051813,
            "_nanoseconds": 677000000
          },
          "docId": "00"
        },
        ...
      ]
    },
    ...
  ]
}
```

<br />
<br />


### **/workspaces/(:wsID)/tangible** 
| メソッド | 認証   |
| -------- | ------ |
| GET   | 必要 |
- タンジブルが稼働状態のとき、最新マーカー情報を緯度経度、回転情報付きで返す
- tangible.markersのマーカーにはマーカー本体情報を付与
```
[
  {
    "area": {
      "SW": { "lng": 139.***, "lat": 35.*** },
      "NE": { "lng": 139.***, "lat": 35.*** },
      "center": { "lng": 139.***, "lat": 35.*** },
      "rotation": 0,
      "zoom": 18
    },
    "title": "area2",
    "tangibleID": "******",
    "created": {
      "_seconds": 1690184599,
      "_nanoseconds": 428000000
    },
    "modified": {
      "_seconds": 1690184599,
      "_nanoseconds": 428000000
    },
    "docId": "******",
    "markers": [
      {
        "objID": "bldg_******",
        "comment": "",
        "type": "building",
        "markerID": "04",
        "created": {
          "_seconds": 1690184599,
          "_nanoseconds": 660000000
        },
        "modified": {
          "_seconds": 1690184599,
          "_nanoseconds": 660000000
        },
        "docId": "04"
      },
      {
        "objID": "******",
        "comment": "",
        "type": "furniture",
        "markerID": "00",
        "created": {
          "_seconds": 1690184599,
          "_nanoseconds": 660000000
        },
        "modified": {
          "_seconds": 1690184599,
          "_nanoseconds": 660000000
        },
        "docId": "00"
      },
      ...
    ],
    "tangible": {
      "active": true,
      "timestamp": "2023-07-26T16:12",
      "markers": [
        {
          "objID": "bldg_******",
          "comment": "",
          "type": "building",
          "markerID": "02",
          "created": {
            "_seconds": 1690184599,
            "_nanoseconds": 660000000
          },
          "modified": {
            "_seconds": 1690184599,
            "_nanoseconds": 660000000
          },
          "docId": "02",
          "center": { "lat": 35.***, "lng": 139.*** },
          "rotation": ***,
          "bldg": {
            "gmlID": "bldg_***",
            "footprint": [
              {
                "altitude": 3.-,
                "latitude": 35.-,
                "longitude": 139.-
              },
              {
                "altitude": 3.-,
                "latitude": 35.-,
                "longitude": 139.-
              },
              ...
            ],
            "center": {
              "altitude": 3.-,
              "latitude": 35.-,
              "longitude": 139.-
            },
            "bldgID": "14100-bldg-******",
            "created": {
              "_seconds": 1686895725,
              "_nanoseconds": 740000000
            },
            "modified": {
              "_seconds": 1686895725,
              "_nanoseconds": 740000000
            },
            "height": ******,
            "radius": ******
          }
        },
        {
          "objID": "******",
          "comment": "",
          "type": "furniture",
          "markerID": "00",
          "created": {
            "_seconds": 1690184599,
            "_nanoseconds": 660000000
          },
          "modified": {
            "_seconds": 1690184599,
            "_nanoseconds": 660000000
          },
          "docId": "00",
          "center": { "lat": 35.-, "lng": 139.- },
          "rotation": ***,
          "frn": {
            "created": {
              "_seconds": 1686236400,
              "_nanoseconds": 197000000
            },
            "name": "Note",
            "type": "car",
            "objName": "Note.fbx",
            "thumbnail": "Note.jpg",
            "thumbUrl": "https://******",
            "objUrl": "https://******"
          }
        },
        ...
      ]
    }
  },
  ...
]
```

<br />
<br />


### **/workspaces/(:wsID)/areas/(:areaID)/unitymap**
| メソッド | 認証   |
| -------- | ------ |
| GET/POST   | 必要 |
- Unityにおけるエリアの地表画像？保存、URL取得
- マーカーの本体情報や座標情報は含まない  
- area情報に含まれるNE(North East)からSW(South West)の範囲の1920*1080の画像としてPOSTすること

- レスポンスはGET/POST同様
```
{"url":"https://firebasestorage.googleapis.com/v0/b/******"}
```

**POST**
- 画像ファイルをmultipart/formdataとしてPOST。キーは"file"  
```
curl -X POST \
http://***apibase***/workspaces/(:wsId)/areas/(:areaId)/unitymap \
-H "Authorization: Bearer ***apikey***" \
-F "file=@sample.png"
```

<br />
<br />
