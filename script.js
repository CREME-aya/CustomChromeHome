//DOM構築後に非同期処理として実行する
//container 処理したデータをHTMLに橋渡しする変数
document.addEventListener('DOMContentLoaded', async ()=> {
    const container = document.getElementById('qiita');
    

    //res fetchでRSSを利用してトレンドを検索しに行った結果
    //text 受け取った結果をテキストにする
    //parser テキストや内容を解析する
    //xml テキストを解析し解析済みデータにする
    //entries 全てのタグを保管する
    try{
        const res = await fetch('https://qiita.com/popular-items/feed');
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const entries = xml.querySelectorAll('entry');
        


    }
    
})