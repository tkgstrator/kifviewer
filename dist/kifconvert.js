// グローバル変数
var json;
var turn = 0;
var max = 0;

// 他のプロパティが全て読み込めてから実行される
$(document).ready(function () {
    // コントローラを表示する
    viewControl();
    // JSONを作成する
    // URLの値をとってこれるかどうか
    path = location.href + "/kif/" + $(".shogiboard").val() + ".sfen";
    console.log(path);
    $.get(path, function (data) {

        // 初期盤面から始めたかどうか    
        data.match(/startpos/) ? startpos = true : startpos = false;

        if (startpos) {
            kif = {
                sfen: "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL",
                turn: "b",
                cap: "",
            };
        } else {
            kif = {
                sfen: tmp[2],
                turn: tmp[3],
                cap: tmp[4],
            };
        }
        console.log(kif);

        // 持ち駒情報
        var cap = {
            black: { R: 0, B: 0, G: 0, S: 0, N: 0, L: 0, P: 0 },
            white: { R: 0, B: 0, G: 0, S: 0, N: 0, L: 0, P: 0 },
        };

        // 持ち駒情報を変換していく
        var num = 1;
        Array.prototype.forEach.call(kif.cap, function (p, id) {
            // 数字だったら枚数を覚える
            if (p.match(/[0-9]/)) {
                // その前も数字だったら二桁ということ
                kif.cap[id - 1].match(/[0-9]/) ? num = parseInt(10) + parseInt(p) : num = parseInt(p);
                return;
            }
            p.match(/[a-z]/) ? cap.white[p.toUpperCase()] = num : cap.black[p] = num;
            num = 1;
        });

        var line = new Array();
        var board = new Array();
        // 初期配置を代入する
        Array.prototype.forEach.call(kif.sfen, function (s, id) {
            if (s.match(/[a-z]/) || s.match(/[1-9]/) || s.match(/[A-Z]/)) {
                if (s.match(/[1-9]/)) {
                    for (var i = 0; i < s; i++) {
                        line.push("-");
                    }
                } else {
                    kif.sfen[id - 1] == "+" ? line.push("+" + s) : line.push(s);
                }
            }
        });

        cfen = buildCapture(cap);
        board.push(buildSfen(line, 0) + " " + cfen + " -1");

        // 指し手(moves)を変換して代入
        var key = false;
        var moves = new Array();

        data = data.split(" ");
        Array.prototype.forEach.call(data, function (csa, id) {
            if (key == true) {
                if(csa.match(/resign/)){
                    moves.push("resign");
                    return;
                }
                csa = csa.replace(/a/g, "1");
                csa = csa.replace(/b/g, "2");
                csa = csa.replace(/c/g, "3");
                csa = csa.replace(/d/g, "4");
                csa = csa.replace(/e/g, "5");
                csa = csa.replace(/f/g, "6");
                csa = csa.replace(/g/g, "7");
                csa = csa.replace(/h/g, "8");
                csa = csa.replace(/i/g, "9");
                moves.push(csa);
                // console.log(csa); // CSA風の指し手を表示
            }
            if (csa.match(/moves/)) key = true;
        });

        var sfen = new Array();
        Array.prototype.forEach.call(moves, function (move, id) {
            // 持ち駒を打った
            if(move.match(/resign/)){
                board.push(buildSfen(line, id) + " " + cfen + " -1");
                max = id + 1;
                return;
            }

            if (move.match(/\*/)) {
                bpos = "**";
                apos = Pos(move.substr(2, 2));
                movp = move.substr(0, 1); // 動かす駒
                // 手番チェック機能
                (kif.turn == "w" && id % 2 == 0) || (kif.turn == "b" && id % 2 == 1) ? movp = movp.toLowerCase() : movp;
                movp != movp.toLowerCase() ? cap.black[movp.toUpperCase()] -= 1 : cap.white[movp.toUpperCase()] -= 1;
                line[apos] = movp; // 新しい座標に移動
                // 駒を移動させた
            } else {
                bpos = Pos(move.substr(0, 2));
                apos = Pos(move.substr(2, 2));
                line, cap = Mov(line, cap, bpos, apos, move.match(/\+/));
            }
            // 各局面の情報を追加
            cfen = buildCapture(cap);
            board.push(buildSfen(line, id + 1) + " " + cfen + " " + apos);
            max = id + 1;
        });
        json = { "board": board };
        console.log(board);
        viewBoard();
        addPiece();
    });


    $("body").on("keydown", function (e) {
        if (e.keyCode === 37) {
            prev();
        }
        if (e.keyCode === 38) {
            first();
        }
        if (e.keyCode === 39) {
            next();
        }
        if (e.keyCode === 40) {
            last();
        }
    });
});

// 要リファクタリング(Sfen形式で局面データを返す)
function buildSfen(line, id) {
    sfen = "";
    empty = 0;
    Array.prototype.forEach.call(line, function (s, id) {
        if (id % 9 == 0 && id > 1) {
            if (empty !== 0) {
                sfen += empty;
                empty *= 0;
            }
            sfen += "/";
        }
        if (s !== "-") {
            if (empty !== 0) {
                sfen += empty;
                empty *= 0;
            }
            sfen += s;
        } else {
            empty++;
        }
    });
    empty > 0 ? sfen += empty : ""; // ゴミが残っていたら出力する
    id % 2 == 0 ? sfen += " b" : sfen += " w"; // 手番情報出力
    return sfen;
}

// 指し手を与えると配列の番号を返す関数
function Pos(pos) {
    x = 10 - parseInt(pos / 10);
    y = pos % 10;
    return x + (y - 1) * 9 - 1;
}

function buildCapture(cap) {
    sfen = "";
    Object.keys(cap.black).forEach(function (key) {
        if (cap.black[key] == 0) return;
        if (cap.black[key] == 1) sfen += key;
        if (cap.black[key] >= 2) sfen += (cap.black[key] + key);
    });
    Object.keys(cap.white).forEach(function (key) {
        if (cap.white[key] == 0) return;
        if (cap.white[key] == 1) sfen += key.toLowerCase();
        if (cap.white[key] >= 2) sfen += (cap.white[key] + key.toLowerCase());
    });
    return sfen;
}

// bposの駒をaposに移動
function Mov(line, cap, bpos, apos, prom) {
    // 移動先に駒があればそれを加える
    if (line[apos] != "-") {
        // 移動先が小文字(後手の駒)なら
        p = line[apos].replace(/\+/, ""); // 成り駒なら元の駒に戻す

        p == p.toLowerCase() ? cap.black[p.toUpperCase()] += 1 : cap.white[p] += 1;
    }
    prom != null ? line[apos] = "+" + line[bpos] : line[apos] = line[bpos];
    line[bpos] = "-";
    return line, cap;
}

// チェックは甘いが、最低限これくらいの情報がないと始まらないので
function CheckValid(sfen) {
    if (sfen.match(/position/) && sfen.match(/sfen/) && sfen.match(/moves/)) {
        return true;
    }
    return false;
}

// コントロールボタンをつくります
function viewControl() {
    $(".shogiboard").append('<ul class="center-block">');
    $('ul').append('<li class="material-icons ctlbtn" onclick="first()">first_page</li>');
    $('ul').append('<li class="material-icons ctlbtn" onclick="prev()">chevron_left</li>');
    $('ul').append('<li class="material-icons ctlbtn" onclick="next()">chevron_right</li>');
    $('ul').append('<li class="material-icons ctlbtn" onclick="last()">last_page</li>');
    $('ul').wrap('<div class="control" />');
}


// 以下、出力されたJSONを読み込むところ
function viewBoard() {
    var board = Snap("#board").g();
    board.rect(62, 37, 451, 451).attr({
        fill: "#FFC107",
        stroke: "#000000",
        strokeWidth: 3,
    });
    // 将棋盤を表示
    var text_n = new Array("１", "２", "３", "４", "５", "６", "７", "８", "９");
    var text_k = new Array("一", "二", "三", "四", "五", "六", "七", "八", "九");
    for (var i = 0; i < 9; i++) {
        board.line(112.5 + 50 * i, 37.5, 112.5 + 50 * i, 487.5).attr({
            strokeWidth: 2,
            stroke: "#000000"
        });
        board.line(62.5, 87.5 + 50 * i, 512.5, 87.5 + 50 * i).attr({
            strokeWidth: 2,
            stroke: "#000000"
        });
        board.text(487 - 50 * i, 28 + 2 / 3, text_n[i]).attr({
            fontSize: 20,
            fontFamily: "Yu Mincho",
            textAnchor: "middle",
        });
        board.text(529.7, 70 + 50 * i, text_k[i]).attr({
            fontSize: 20,
            fontFamily: "Yu Mincho",
            textAnchor: "middle",
        });
    }
}

function first() {
    turn *= 0;
    var paper = Snap("#board");
    paper.clear();
    viewBoard();
    addPiece();
}

function prev() {
    --turn;
    var paper = Snap("#board");
    paper.clear();
    viewBoard();
    addPiece();
}

function next() {
    ++turn;
    var paper = Snap("#board");
    paper.clear();
    viewBoard();
    addPiece();
}

function last() {
    turn = max;
    var paper = Snap("#board");
    paper.clear();
    viewBoard();
    addPiece();
}

function addPiece() {
    var piece = Snap("#board").g();
    moves = json["board"];

    // 範囲外を参照しないための処理
    turn < 0 ? turn = 0 : turn;
    turn > max ? turn = max : turn;

    sfen = moves[turn].split(" ")[0];
    capture = moves[turn].split(" ")[2];

    player = {
        black: {
            koma: piece.g().transform("translate(567.5, 485)"),
            capture: new Array("先", "手"),
        },
        white: {
            koma: piece.g().transform("translate(32.5, 40) scale(-1, -1)"),
            capture: new Array("後", "手"),
        },
    };

    var tmp = "";
    Array.prototype.forEach.call(capture, function (p, id) {
        // もし数字なら
        if (p.match(/[0-9]/)) {
            tmp += p;
            return;
        }

        switch (p.toLowerCase()) {
            case "p":
                text = "歩";
                break;
            case "l":
                text = "香";
                break;
            case "n":
                text = "桂";
                break;
            case "r":
                text = "飛";
                break;
            case "b":
                text = "角";
                break;
            case "g":
                text = "金";
                break;
            case "s":
                text = "銀";
                break;
            default:
                text = "";
                break;
        }
        // 小文字にしても同じなら相手の駒
        if (p == p.toLowerCase()) {
            player.white.capture.push(text);
        } else {
            player.black.capture.push(text);
        }

        // 枚数チェック
        if (tmp.length > 0) {
            switch (tmp) {
                case "2":
                    num = ["二"];
                    break;
                case "3":
                    num = ["三"];
                    break;
                case "4":
                    num = ["四"];
                    break;
                case "5":
                    num = ["五"];
                    break;
                case "6":
                    num = ["六"];
                    break;
                case "7":
                    num = ["七"];
                    break;
                case "8":
                    num = ["八"];
                    break;
                case "9":
                    num = ["九"];
                    break;
                case "10":
                    num = ["十"];
                    break;
                case "11":
                    num = ["十", "一"];
                    break;
                case "12":
                    num = ["十", "二"];
                    break;
                case "13":
                    num = ["十", "三"];
                    break;
                case "14":
                    num = ["十", "四"];
                    break;
                case "15":
                    num = ["十", "五"];
                    break;
                case "16":
                    num = ["十", "六"];
                    break;
                case "17":
                    num = ["十", "七"];
                    break;
                case "18":
                    num = ["十", "八"];
                    break;
                default:
                    break;
            }
            if (p == p.toLowerCase()) {
                Array.prototype.push.apply(player.white.capture, num);
            } else {
                Array.prototype.push.apply(player.black.capture, num);
            }
            tmp = "";
        }
    });

    // 持ち駒がないときは駒がないことを表示する
    player.black.capture.length == 2 ? Array.prototype.push.apply(player.black.capture, ["な", "し"]) : player.black.capture.push();
    player.white.capture.length == 2 ? Array.prototype.push.apply(player.white.capture, ["な", "し"]) : player.white.capture.push();

    // 駒の図形の描画
    player.black.pos = ((player.black.capture.length)) * (28 + 1 / 7) * (-1) + 20;
    player.white.pos = ((player.white.capture.length)) * (28 + 1 / 7) * (-1) + 20;
    player.black.point = new Array(0, player.black.pos - 65, 11.5, player.black.pos - 60, 15, player.black.pos - 35, -15, player.black.pos - 35, -11.5, player.black.pos - 60, 0, player.black.pos - 65);
    player.white.point = new Array(0, player.white.pos - 65, 11.5, player.white.pos - 60, 15, player.white.pos - 35, -15, player.white.pos - 35, -11.5, player.white.pos - 60, 0, player.white.pos - 65);

    player.black.koma.polyline(player.black.point);
    player.white.koma.polyline(player.white.point).attr({
        fill: "none",
        stroke: "#000000",
        strokeWidth: 2,
    });

    // 持ち駒情報表示
    var size = (28 + 1 / 7);

    for (var i = 0; i < player.black.capture.length; i++) {
        // 持ち駒の数から位置を計算
        i <= 1 ? pos = i + 0.5 : pos = i + 1;
        player.black.dai = (pos - (player.black.capture.length)) * size;
        player.black.koma.text(0, player.black.dai, player.black.capture[i]).attr({
            fontSize: size,
            fontFamily: "Yu Mincho",
            textAnchor: "middle",
        });
    }
    for (var i = 0; i < player.white.capture.length; i++) {
        // 持ち駒の数から位置を計算
        i <= 1 ? pos = i + 0.5 : pos = i + 1;
        player.white.dai = (pos - (player.white.capture.length)) * size;

        player.white.koma.text(0, player.white.dai, player.white.capture[i]).attr({
            fontSize: size,
            fontFamily: "Yu Mincho",
            textAnchor: "middle",
        });
    }

    lmv = moves[turn].split(" ")[3];

    var isProm = false;

    line = new Array();

    // 一文字ずつ出力
    Array.prototype.forEach.call(sfen, function (s, id) {
        // 正規表現を使った小文字判定
        if (s.match(/[a-z]/) || s.match(/[1-9]/) || s.match(/[A-Z]/)) {
            if (s.match(/[1-9]/)) {
                for (var i = 0; i < s; i++) {
                    line.push("");
                }
            } else {
                sfen[id - 1] == "+" ? line.push("+" + s) : line.push(s);
            }
        }
    });

    // 盤面に駒を表示する
    Array.prototype.forEach.call(line, function (s, id) {
        switch (s.toLowerCase()) {
            case "p":
                text = "歩";
                break;
            case "l":
                text = "香";
                break;
            case "n":
                text = "桂";
                break;
            case "r":
                text = "飛";
                break;
            case "b":
                text = "角";
                break;
            case "g":
                text = "金";
                break;
            case "s":
                text = "銀";
                break;
            case "k":
                text = "玉";
                break;
            case "+p":
                text = "と";
                break;
            case "+l":
                text = "杏";
                break;
            case "+n":
                text = "圭";
                break;
            case "+r":
                text = "龍";
                break;
            case "+b":
                text = "馬";
                break;
            case "+s":
                text = "全";
                break;
            default:
                text = "";
                break;
        }

        // idを座標に変換
        m = id % 9;
        n = parseInt(id / 9);

        x = 50 * m + 87.5;
        y = 50 * n + 62.5;

        // もし最終手なら
        if (id == lmv) {
            console.log(turn, lmv);
            back = piece.g().rect(x - 25, y - 25, 50, 50).attr({
                fill: "#111111",
            });

            if (s == s.toLowerCase()) {
                white = piece.g().transform(`translate(${x}, ${y}) scale(-1, -1)`);
                white.text(0, 0, text).attr({
                    textAnchor: "middle",
                    fill: "#FFFFFF",
                    dy: 16,
                    fontSize: 41,
                    fontFamily: "Yu Mincho",
                });
            } else {
                black = piece.g().transform(`translate(${x}, ${y})`);
                black.text(0, 0, text).attr({
                    textAnchor: "middle",
                    fill: "#FFFFFF",
                    dy: 16,
                    fontSize: 41,
                    fontFamily: "Yu Mincho",
                });
            }
        } else {
            if (s == s.toLowerCase()) {
                white = piece.g().transform(`translate(${x}, ${y}) scale(-1, -1)`);
                white.text(0, 0, text).attr({
                    textAnchor: "middle",
                    fill: "#000000",
                    dy: 16,
                    fontSize: 41,
                    fontFamily: "Yu Mincho",
                });
            } else {
                black = piece.g().transform(`translate(${x}, ${y})`);
                black.text(0, 0, text).attr({
                    textAnchor: "middle",
                    fill: "#000000",
                    dy: 16,
                    fontSize: 41,
                    fontFamily: "Yu Mincho",
                });
            }
        }
    });
}
