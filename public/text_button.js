/** * 音声認識のインスタンス. */
// const BGM = new Audio('STAR WARS theme.mp3');

function bgmStartButtonClick() {
    // BGM.volume = 0.4;
    // BGM.play();
    mode_janken = true;
    console.log("スイッチを押して" + mode_janken);
    let elm = document.getElementById('text');
    return new Promise((resolve, reject) => {
        let texts = "さーいしょはぐ-----.".split('');
        function showMessage(texts, cb) {
            if (texts.length === 0) {
                return cb();
            }
            let ch = texts.shift();
            elm.innerHTML += ch;
            setTimeout(() => {
                showMessage(texts, cb);
            }, 60);
        }
        elm.innerHTML = '';
        showMessage(texts, resolve);
    });
}

function bgmStopButtonClick() {
    if (nowPlaying) {
        // BGM.pause();
        // BGM.currentTime = 0;
        // nowPlaying = false;
    }
    let elm = document.getElementById('text');
    return new Promise((resolve, reject) => {
        let texts = "ジャンケンを始めよう !!!".split('');
        function showMessage(texts, cb) {
            if (texts.length === 0) {
                return cb();
            }
            let ch = texts.shift();
            elm.innerHTML += ch;
            setTimeout(() => {
                showMessage(texts, cb);
            }, 60);
        }
        elm.innerHTML = '';
        showMessage(texts, resolve);
    });
}

/** * アプリ起動時に、説明を表示します. */
function startIntro() {
    let elm = document.getElementById('text');
    return new Promise((resolve, reject) => {
        let texts = "ジャンケンを始めよう !!!".split('');
        function showMessage(texts, cb) {
            if (texts.length === 0) {
                return cb();
            }
            let ch = texts.shift();
            elm.innerHTML += ch;
            setTimeout(() => {
                showMessage(texts, cb);
            }, 60);
        }
        elm.innerHTML = '';
        showMessage(texts, resolve);
    });
}

/** * アプリを起動します. */
window.addEventListener('DOMContentLoaded', () => {
    // アプリの説明を行います.
    startIntro().then(() => {
        // ボタンの表示と挙動
        document.querySelector('.js-btn-group').classList.add('--visible');
        document.getElementById('startButton').onclick = bgmStartButtonClick;
        document.getElementById('stopButton').onclick = bgmStopButtonClick;
    });
});
