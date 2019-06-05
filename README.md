# KifViewer
シンプルすぎるHTML5 + javascriptで動作する棋譜再生ビューワです. 

動作ページは[こちら](https://tkgstrator.github.io/kifviewer/).

SVGですのでレスポンシブルな使い方ができます.

## 機能/仕様
- Sfen形式の棋譜のみを再生できます.
  - KIF形式, CSA形式, KI2形式には対応していません.
  - Sfen形式での棋譜の出力はShogiGUIなどが対応しています.
- ボタンで棋譜操作ができます.
  - 一手進む, 戻る, 初手に戻る, 最終手に進むができます.
- 指し手は表示されません.
  - 最終手が強調表示されます.
  - 持ち駒は全て表示されますが, あまりに多いとかなり長くなります.
- 分岐機能はありません.

## 使い方
ajaxを利用しているのでjqueryが必須になっています.

以下のコードを書くとshogiboardクラスに棋譜ビューワを描画します.

```html
<data class="shogiboard" id="kif" value="ryu3001">
      <svg id="board" xmlns="http://www.w3.org/2000/svg" width="600" height="550" viewBox="0, 0, 600, 550"></svg>
    </data>
```

- SVG描画のために`<svg></svg>`タグは必須です.
- shogiboardクラスのidにkifを設定し, valueで棋譜ファイル名を指定します.
  - Cloneしてそのままどっかに公開すればそのまま使えます(多分)

ヘッダ部で以下のJSおよびCSSの読み込みが必要です.

```html
<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
<script type="text/javascript" src="dist/kifconvert.js" charset="utf-8"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/snap.svg/0.4.1/snap.svg.js"></script>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link href="css/shogistyle.css" rel="stylesheet">
```

  ## 注意書き
  JSもといプログラミング初心者なのでかなりひどいコードになってます. 少しずつ修正できたらと思うんですが, 誰か優しくご教授ください.
  
  コーディング規約とか全然知らないんですよね...
  
  あとは変数の扱いとかも全然わかってません, Closure CompilerにかけてみたらWarningが33もでてビビりました(笑)
