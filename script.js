//DOM処理後に非同期で処理する
//Container HTML構造体への橋渡し
document.addEventListener('DOMContentLoaded', async () => {
    //qiitaのタグを探しに行く
    const container = document.getElementById('qiita');

    //res       fetchを利用しRSSで特定のデータを取る
    //text      テキストに変換する
    //parser    DOMを解析する
    //xml       解析済みのデータを持つ
    //entries   全ての記事のタグをもつ
    try {
        const res = await fetch('https://qiita.com/popular-items/feed');
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const entries = xml.querySelectorAll('entry');
        
        //containerに関連するインラインHTMLのテキストを非表示にする
        container.innerHTML = '';

        //title     記事のタイトルを走査する
        //linkNode  記事のタグを走査する
        //url       リンクのタグから文字列として属性を抜き出す
        //aTag      <a href=""></a>を生成する(これを持つ)
        //div       <div></div>を生成する(これを持つ)
        //entriesからentryに要素数分だけ代入ループ
        entries.forEach((entry) => {
            const title = entry.querySelector('title').textContent;
            const linkNode = entry.querySelector('link');
            const url = linkNode ? linkNode.getAttribute('href') : '#';
            const aTag = document.createElement('a');
            const div = document.createElement('div');


            //href="url"
            aTag.href = url;
            //文字列としてtitleを取得
            aTag.textContent = title;
            //新しいタブで実行する
            aTag.target = '_blank';
            //divの中にaTagを格納する
            //<div><aTag></aTag></div>のイメージ
            div.appendChild(aTag);
            
            //先ほどのdivをHTMLに格納する
            container.appendChild(div);
        });  
    } catch(err) {
        console.error(err);
        container.textContent = "記事の取得に失敗しました。";
    }
});