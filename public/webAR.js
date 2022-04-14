//MediaPipeやOpenCVでの処理を記述
let canvasElement;
let canvasCtx;  //キャンバスコンテキストを使って絵を描く
// let ell; //手の位置や傾きを楕円
let ratio_Pa1;  //パーの判定
let ratio_Pa2;  //パーの判定
let isStandingThumb = false;  //親指が立ち上がっているかどうかのフラグ
let posThumbs = [0, 0];  //[x座標, y座標]といったように格納していく
let thumbPos_x = 0;
let thumbPos_y = 0;
let thumbPosPast_x = 0;
let thumbPosPast_y = 0;
let deltaPos_x = 0;
let deltaPos_y = 0;
let deltaPos = 0;
let flag_forLeaveSpace = 0;
let rightOrLeft = 0;  //1ならright 2ならleft
let SE_flag = 0;

//初期化
window.onload = function () {
    //画像の読み込み
    beam = document.getElementById('beam');
    //ビデオ要素の取得
    let videoElement = document.getElementById('input_video');
    //表示用のCanvasを取得
    canvasElement = document.getElementById('output_canvas');
    //Canvas描画に関する情報にアクセス
    canvasCtx = canvasElement.getContext('2d');
    //HandTrackingを使用するための関連ファイルの取得と初期化
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    //手の認識に関するオプション 
    hands.setOptions({
        selfieMode: true,  //画像を左右反転
        maxNumHands: 1, //認識可能な手の最大数
        modelComplexity: 1,//精度に関する設定(0~1)
        minDetectionConfidence: 0.4,//手検出の信頼度 0〜1の値が帰ってきた時に幾つ以上の場合に手を判定するか
        minTrackingConfidence: 0.3,//手追跡の信頼度
        useCpuInference: false, //M1 MacのSafariの場合は1  crhomかfirefoxでやる
    });
    //結果を処理する関数を登録
    console.log(hands);
    hands.onResults(recvResults);

    //カメラの初期化
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            //カメラの画像を用いて手の検出を実行
            await hands.send({ image: videoElement });  //videoElementの映像をハンドトラッキング処理に渡す
        },
        width: 1280, height: 720  //画像サイズを設定
    });
    //カメラの動作開始
    camera.start();
};

//results = MediaPipeによる手の検出結果 を利用する
function recvResults(results) {
    let width = results.image.width;  //イメージの元画像お大きさ
    let height = results.image.height;
    //画像のサイズとcanbasのサイズが異なる場合はサイズを調整
    if (width != canvasElement.width) { //最初は一致しないので
        //入力画像と同じサイズのcanvas(描画領域)を用意
        canvasElement.width = width;
        canvasElement.height = height;
    }
    //以下canvasへの描画に関する記述 saveで始まりrestoreでおわる
    canvasCtx.save();
    //(カメラで取得した)画像を表示  →消すと白いキャンバスにひたすら手の動きが描画されていく 
    canvasCtx.drawImage(results.image, 0, 0, width, height);
    //手を検出したならばtrue
    if (results.multiHandLandmarks) {
        //見つけた手の数だけ処理を繰り返す
        for (const landmarks of results.multiHandLandmarks) {
            //骨格を描画(MediaPipeのライブラリ)  コメントアウトすれば表示せずに済む
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#040404', lineWidth: 1 });  //大きくすると線が太くなる
            //関節を描画(MediaPipeのライブラリ)  コメントアウトすれば表示せずに済む
            drawLandmarks(canvasCtx, landmarks, { color: '#000000', lineWidth: 1, radius: 2 });
            //orignal - openCVのファンクション landmarksの計算処理
            cvFunction(landmarks, width, height);
            //orignal - イメージを描画する関数
            // drawLightSaber(); //自作関数
        }
    }
    canvasCtx.restore();
    if (nowPlaying) {
        hands.setOptions({
            selfieMode: true,  //画像を左右反転
            maxNumHands: 2,  //認識可能な手の最大数
            modelComplexity: 1, //精度に関する設定(0~1)
            minDetectionConfidence: 0.4, //手検出の信頼度 0〜1の値が帰ってきた時に幾つ以上の場合に手を判定するか
            minTrackingConfidence: 0.3, //手追跡の信頼度
            useCpuInference: false,  //M1 MacのSafariの場合は1  crhomかfirefoxでやる
        });
        //結果を処理する関数を登録
        console.log("setOptions_to_2");
        // hands.onResults(recv2Results);
        hands.onResults(recvResults);
    }
}

//手の中心や傾きを計算  関節の点群データlandmarksは画像の各幅全体を1と置き換えたパラメーターになっている。配列で０番目から20番目までの値が入っている
function cvFunction(landmarks, width, height) {
    ////イメージを重ね合わせるための楕円の用意
    //手の関節を保持する配列
    // let points = [];
    // //手のひらや親指の付け根付近以外の関節を取得
    // for (var i = 0; i < 21; i++) {
    //     //0~1で表現されたx,yを画像のサイズに変換
    //     points.push(landmarks[i].x * width);
    //     points.push(landmarks[i].y * height);
    // }
    //点の集まりをOpenCVで扱えるデータフォーマットmatに変換
    // let mat = cv.matFromArray(points.length / 2, 1, cv.CV_32SC2, points);
    //点の集まりにフィットする楕円を計算
    // ell = cv.fitEllipse(mat);
    //メモリの解放(変数定義するとメモリを消費しているので不要になったら消す)
    // mat.delete();

    //手首と人差し指までの距離 index_d 
    let dx = (landmarks[8].x - landmarks[0].x) * width;
    let dy = (landmarks[8].y - landmarks[0].y) * height;
    let index_d1 = Math.sqrt(dx * dx + dy * dy);
    //人差し指付け根から手首までの距離
    dx = (landmarks[5].x - landmarks[0].x) * width;
    dy = (landmarks[5].y - landmarks[0].y) * height;
    let index_d2 = Math.sqrt(dx * dx + dy * dy);
    //人差し指の立ち具合
    ratio_index = index_d1 / index_d2;
    console.log(ratio_index);
    let close = 1.2; //0.6:close, 1.3:sumb up 閉じる条件は少し甘めに0.9にする
    let up = 1.6; //指が立ち上がっている状態
    ratio_Pa1 = (Math.max(close, Math.min(up, ratio_index)) - close) / (up - close); //0~1に正規化
    console.log("index_up : " + ratio_Pa1);

    //手首付け根と人差し指までの距離 index_d 
    dx = (landmarks[20].x - landmarks[0].x) * width;
    dy = (landmarks[20].y - landmarks[0].y) * height;
    let pinky_d1 = Math.sqrt(dx * dx + dy * dy);
    //小指付け根から手首までの距離
    dx = (landmarks[17].x - landmarks[0].x) * width;
    dy = (landmarks[17].y - landmarks[0].y) * height;
    let pinky_d2 = Math.sqrt(dx * dx + dy * dy);
    //人差し指の立ち具合
    ratio_pinky = pinky_d1 / pinky_d2;
    // console.log(ratio_index);
    close = 1.2; //0.6:close, 1.3:sumb up 閉じる条件は少し甘めに0.9にする
    up = 1.6; //指が立ち上がっている状態
    ratio_Pa2 = (Math.max(close, Math.min(up, ratio_pinky)) - close) / (up - close); //0~1に正規化
    console.log("pinky_up : " + ratio_Pa2);
    if (ratio_Pa1 == 1 && ratio_Pa2 == 1) console.log("janken - Pa");  //パーの状態
}

//ライトセイバーを表示
function drawLightSaber() {  //画像、位置X、位置Y、横幅、縦幅
    //楕円の角度
    let angle = ell.angle;
    //ライトセイバーの向きを反転 openCVは第２.３象限でしか角度判定できない 
    if (angle < 90) { angle = angle - 180; }
    //デフォルトサイズを元画像の２倍くらいにしたい  ratioをかけることで親指の立ち具合で大きさが変わるようになった
    let mul = ratio * (ell.size.width * 1.5) / beam.width;
    //位置指定
    canvasCtx.translate(ell.center.x, ell.center.y);
    //角度指定
    canvasCtx.rotate(angle * Math.PI / 180.0); //openCVの角度は°でcanvasはラジアン
    //楕円を描画
    canvasCtx.beginPath();    //複数の点をつなぐ線を書くよの宣言
    canvasCtx.ellipse(0, 0,   //位置 楕円そのものでは位置指定せず、全体のオブジェクトに対してtranslate()で指定する
        ell.size.width / 2.0, ell.size.height / 2.0,  //半径
        0, 0, 2 * Math.PI);    //角度と表示の開始・終了
    // canvasCtx.stroke();  //線で書くよ
    // デフォルトサイズに倍数をかける
    canvasCtx.scale(mul, mul);
    if (nowPlaying) {
        // canvasCtx.drawImage(beam, -beam.width / 2.0, 0, beam.width, beam.height); //画像の位置をあらかじめx方向に半分ずらす
    } else if (nowPlaying) {
        // canvasCtx.drawImage(beam_blue, -beam_blue.width / 2.0, 0, beam_blue.width, beam_blue.height);
    }
}

//かめはめ波を表示
// function drawKamehameha() {  //画像、位置X、位置Y、横幅、縦幅
//     //楕円の角度
//     // let angle = ell_rect.angle;
//     let angle = ell_rect.angle + 90;
//     //ライトセイバーの向きを反転 openCVは第２.３象限でしか角度判定できない 
//     if (angle < 90) { angle = angle + 180; }
//     //デフォルトサイズを元画像の２倍くらいにしたい  ratioをかけることで親指の立ち具合で大きさが変わるようになった
//     let mul = 3.0 * (ell_rect.size.width * 1.5) / kameha.width;
//     //位置指定
//     canvasCtx.translate(ell_rect.center.x, ell_rect.center.y);
//     //角度指定
//     canvasCtx.rotate(angle * Math.PI / 180.0); //openCVの角度は°でcanvasはラジアン
//     //楕円を描画
//     canvasCtx.beginPath();    //複数の点をつなぐ線を書くよの宣言
//     canvasCtx.ellipse(0, 0,   //位置 楕円そのものでは位置指定せず、全体のオブジェクトに対してtranslate()で指定する
//         ell_rect.size.width / 2.0, ell_rect.size.height / 2.0,  //半径
//         0, 90, 2 * Math.PI);    //角度と表示の開始・終了
//     // ellipse(中心のx座標, 中心のy座標, x方向の半径, y方向の半径,傾き, 開始角度, 終了角度, [回転方向]);
//     // canvasCtx.stroke();  //線で書くよ
//     //デフォルトサイズに倍数をかける
//     canvasCtx.scale(mul, mul);
//     canvasCtx.drawImage(kameha, -kameha.width / 2.0, -kameha.width / 12.0, kameha.width, kameha.height); //画像の位置をあらかじめx方向に半分ずらす
// }

//親指が立っている間に親指のxy座標を拾って、差分を取って速度を計算する
function thumb_deltaPos(landmark_4) {
    thumbPos_x = landmark_4.x;
    thumbPos_y = landmark_4.y;
    posThumbs = [thumbPos_x, thumbPos_y]
    // console.log(posThumbs);
    deltaPos_x = thumbPos_x - thumbPosPast_x;
    deltaPos_y = thumbPos_y - thumbPosPast_y;
    deltaPos = Math.sqrt(deltaPos_x * deltaPos_x + deltaPos_y * deltaPos_y) * 100;
    // console.log(deltaPos);
    let a = deltaPos_x * 100;
    console.log(a);
    if (a >= 0) {
        rightOrLeft = 1;
    } else if (a < 0) {
        rightOrLeft = 2;
    }
    // console.log(rightOrLeft);
    //移動距離が一定量より大きかったら効果音を出す
    if (deltaPos >= 5) {
        swingSaber_SE();
    }
    //リセット
    thumbPosPast_x = thumbPos_x;
    thumbPosPast_y = thumbPos_y;
    flag_forLeaveSpace = 0;
}

/////効果音
//ライトセイバー振った時の効果音
function swingSaber_SE() {
    if (rightOrLeft == 1) {
        // console.log("swingRight");
        SE_right.play();
    } else if (rightOrLeft == 2) {
        // console.log("swingLeft");
        SE_left.play();
    }
}
