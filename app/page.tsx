export default function Home() {
  return (
    <main style={{padding:40,fontFamily:'Arial, sans-serif'}}>
      <h1>골프왕부킹</h1>
      <p>희망 라운딩 날짜를 입력하면 예약 오픈 일시를 확인할 수 있습니다.</p>
      <div style={{marginTop:20}}>
        <label htmlFor="date">플레이 날짜: </label>
        <input id="date" type="date" />
        <button style={{marginLeft:8}}>검색</button>
      </div>
    </main>
  )
}
