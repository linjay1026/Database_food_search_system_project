import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import nullImage from './data/null_image.png';

function getLoggedInUser() {
  return localStorage.getItem("loggedInUser");
}

function getFavorites(user) {
  return JSON.parse(localStorage.getItem(`favorites_${user}`)) || [];
}

function isFavorite(user, id) {
  return getFavorites(user).includes(id);
}

function toggleFavorite(user, id) {
  const current = getFavorites(user);
  const updated = current.includes(id)
    ? current.filter(rid => rid !== id)
    : [...current, id];
  localStorage.setItem(`favorites_${user}`, JSON.stringify(updated));
}

function getVisiblePageNumbers(currentPage, totalPages, windowSize = 2) {
  const pages = [];

  const start = Math.max(2, currentPage - windowSize);
  const end = Math.min(totalPages - 1, currentPage + windowSize);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (end < totalPages - 1) pages.push("...");

  return [1, ...pages, totalPages];
}

export default function RestaurantSearch() {
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [district, setDistrict] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [jumpPageInput, setJumpPageInput] = useState("");
  const [station, setStation] = useState("");
  const user = getLoggedInUser();
  const [favorites, setFavorites] = useState([]);
  const userId = Number(localStorage.getItem("loggedInUser"));

  async function fetchData() {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (cuisine) params.append("cuisine", cuisine);
      if (district) params.append("district", district);
      if (station) params.append("station", station);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurants?${params.toString()}`);
        const json = await res.json();
        console.log("取得的資料", json);
        setRestaurants(json);
        setCurrentPage(1);
      } catch (err) {
        console.error("載入餐廳資料失敗", err);
      }
    }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchFavorites() {
      if (!userId) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/${userId}`);
        if (!res.ok) throw new Error("無法取得收藏清單");
        const data = await res.json();
        setFavorites(data.map(r => r.restaurant_id)); // 只保留 ID
      } catch (err) {
        console.error("載入收藏失敗：", err);
      }
    }

    fetchFavorites();
  }, [userId]);

  async function handleToggleFavorite(userId, restaurantId) {
    const isFav = favorites.includes(restaurantId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
        method: isFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: Number(userId), restaurant_id: restaurantId }),
      });

      if (!res.ok) throw new Error("收藏操作失敗");

      // 更新狀態（不使用 localStorage）
      const newFavs = isFav
        ? favorites.filter(id => id !== restaurantId)
        : [...favorites, restaurantId];
      setFavorites(newFavs);
    } catch (err) {
      alert("❌ 無法更新收藏：" + err.message);
    }
  }



  const totalPages = Math.ceil(restaurants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = restaurants.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="container">
      <h1>🍽 美食搜尋系統</h1>

      <div className="filters" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="輸入餐廳名稱"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
          <option value="">所有料理</option>
          <option value="Chinese 中式">中式</option>
          <option value="Japanese 日式">日式</option>
          <option value="Italian 義式">義式</option>
          <option value="Korean 韓式">韓式</option>
          <option value="Brunch 早午餐">早午餐</option>
          <option value="Dessert 甜點">甜點</option>
          <option value="Others 其他">其他</option>
        </select>
        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">所有地區</option>
          <optgroup label="台北市">
            <option value="中正區">中正區</option>
            <option value="大同區">大同區</option>
            <option value="中山區">中山區</option>
            <option value="松山區">松山區</option>
            <option value="大安區">大安區</option>
            <option value="萬華區">萬華區</option>
            <option value="信義區">信義區</option>
            <option value="士林區">士林區</option>
            <option value="北投區">北投區</option>
            <option value="內湖區">內湖區</option>
            <option value="南港區">南港區</option>
            <option value="文山區">文山區</option>
          </optgroup>
          <optgroup label="新北市">
            <option value="板橋區">板橋區</option>
            <option value="新莊區">新莊區</option>
            <option value="中和區">中和區</option>
            <option value="永和區">永和區</option>
            <option value="三重區">三重區</option>
            <option value="蘆洲區">蘆洲區</option>
            <option value="土城區">土城區</option>
            <option value="樹林區">樹林區</option>
            <option value="鶯歌區">鶯歌區</option>
            <option value="三峽區">三峽區</option>
            <option value="淡水區">淡水區</option>
            <option value="八里區">八里區</option>
            <option value="林口區">林口區</option>
            <option value="五股區">五股區</option>
            <option value="泰山區">泰山區</option>
            <option value="新店區">新店區</option>
            <option value="深坑區">深坑區</option>
            <option value="石碇區">石碇區</option>
            <option value="坪林區">坪林區</option>
            <option value="烏來區">烏來區</option>
            <option value="三芝區">三芝區</option>
            <option value="石門區">石門區</option>
            <option value="金山區">金山區</option>
            <option value="萬里區">萬里區</option>
            <option value="瑞芳區">瑞芳區</option>
            <option value="貢寮區">貢寮區</option>
            <option value="平溪區">平溪區</option>
            <option value="雙溪區">雙溪區</option>
            <option value="汐止區">汐止區</option>
          </optgroup>
          <optgroup label="桃園市">
            <option value="龜山區">龜山區</option>
          </optgroup>
        </select>
        <select value={station} onChange={(e) => setStation(e.target.value)}>
          <option value="">所有捷運站</option>
          <optgroup label="文湖線">
            <option value="動物園">動物園</option>
            <option value="木柵">木柵</option>
            <option value="萬芳社區">萬芳社區</option>
            <option value="萬芳醫院">萬芳醫院</option>
            <option value="辛亥">辛亥</option>
            <option value="麟光">麟光</option>
            <option value="六張犁">六張犁</option>
            <option value="科技大樓">科技大樓</option>
            <option value="大安">大安</option>
            <option value="忠孝復興">忠孝復興</option>
            <option value="南京復興">南京復興</option>
            <option value="中山國中">中山國中</option>
            <option value="松山機場">松山機場</option>
            <option value="大直">大直</option>
            <option value="劍南路">劍南路</option>
            <option value="西湖">西湖</option>
            <option value="港墘">港墘</option>
            <option value="文德">文德</option>
            <option value="內湖">內湖</option>
            <option value="大湖公園">大湖公園</option>
            <option value="葫洲">葫洲</option>
            <option value="東湖">東湖</option>
            <option value="南港軟體園區">南港軟體園區</option>
            <option value="南港展覽館">南港展覽館</option>
          </optgroup>
          <optgroup label="淡水信義線">
            <option value="淡水">淡水</option>
            <option value="紅樹林">紅樹林</option>
            <option value="竹圍">竹圍</option>
            <option value="關渡">關渡</option>
            <option value="忠義">忠義</option>
            <option value="復興崗">復興崗</option>
            <option value="北投">北投</option>
            <option value="奇岩">奇岩</option>
            <option value="唭哩岸">唭哩岸</option>
            <option value="石牌">石牌</option>
            <option value="明德">明德</option>
            <option value="芝山">芝山</option>
            <option value="士林">士林</option>
            <option value="劍潭">劍潭</option>
            <option value="圓山">圓山</option>
            <option value="民權西路">民權西路</option>
            <option value="雙連">雙連</option>
            <option value="中山">中山</option>
            <option value="台北車站">台北車站</option>
            <option value="台大醫院">台大醫院</option>
            <option value="中正紀念堂">中正紀念堂</option>
            <option value="東門">東門</option>
            <option value="大安森林公園">大安森林公園</option>
            <option value="大安">大安</option>
            <option value="信義安和">信義安和</option>
            <option value="台北101/世貿">台北101/世貿</option>
            <option value="象山">象山</option>
          </optgroup>
          <optgroup label="松山新店線">
            <option value="松山">松山</option>
            <option value="南京三民">南京三民</option>
            <option value="台北小巨蛋">台北小巨蛋</option>
            <option value="南京復興">南京復興</option>
            <option value="松江南京">松江南京</option>
            <option value="善導寺">善導寺</option>
            <option value="台北車站">台北車站</option>
            <option value="西門">西門</option>
            <option value="小南門">小南門</option>
            <option value="中正紀念堂">中正紀念堂</option>
            <option value="古亭">古亭</option>
            <option value="台電大樓">台電大樓</option>
            <option value="公館">公館</option>
            <option value="萬隆">萬隆</option>
            <option value="景美">景美</option>
            <option value="大坪林">大坪林</option>
            <option value="七張">七張</option>
            <option value="新店區公所">新店區公所</option>
            <option value="新店">新店</option>
            <option value="小碧潭">小碧潭</option>
          </optgroup>
          <optgroup label="中和新蘆線">
            <option value="南勢角">南勢角</option>
            <option value="景安">景安</option>
            <option value="永安市場">永安市場</option>
            <option value="頂溪">頂溪</option>
            <option value="古亭">古亭</option>
            <option value="東門">東門</option>
            <option value="忠孝新生">忠孝新生</option>
            <option value="松江南京">松江南京</option>
            <option value="行天宮">行天宮</option>
            <option value="中山國小">中山國小</option>
            <option value="民權西路">民權西路</option>
            <option value="大橋頭">大橋頭</option>
            <option value="台北橋">台北橋</option>
            <option value="菜寮">菜寮</option>
            <option value="三重">三重</option>
            <option value="先嗇宮">先嗇宮</option>
            <option value="頭前庄">頭前庄</option>
            <option value="新莊">新莊</option>
            <option value="輔大">輔大</option>
            <option value="丹鳳">丹鳳</option>
            <option value="迴龍">迴龍</option>
            <option value="三和國中">三和國中</option>
            <option value="三重國小">三重國小</option>
            <option value="徐匯中學">徐匯中學</option>
            <option value="三民高中">三民高中</option>
            <option value="蘆洲">蘆洲</option>
          </optgroup>
          <optgroup label="板南線">
            <option value="頂埔">頂埔</option>
              <option value="永寧">永寧</option>
              <option value="土城">土城</option>
              <option value="海山">海山</option>
              <option value="亞東醫院">亞東醫院</option>
              <option value="府中">府中</option>
              <option value="板橋">板橋</option>
              <option value="新埔">新埔</option>
              <option value="江子翠">江子翠</option>
              <option value="龍山寺">龍山寺</option>
              <option value="西門">西門</option>
              <option value="台北車站">台北車站</option>
              <option value="善導寺">善導寺</option>
              <option value="忠孝新生">忠孝新生</option>
              <option value="忠孝復興">忠孝復興</option>
              <option value="忠孝敦化">忠孝敦化</option>
              <option value="國父紀念館">國父紀念館</option>
              <option value="市政府">市政府</option>
              <option value="永春">永春</option>
              <option value="後山埤">後山埤</option>
              <option value="昆陽">昆陽</option>
              <option value="南港">南港</option>
              <option value="南港展覽館">南港展覽館</option>
          </optgroup>
          <optgroup label="環狀線（第一階段）">
            <option value="新北產業園區">新北產業園區</option>
            <option value="幸福">幸福</option>
            <option value="頭前庄">頭前庄</option>
            <option value="新莊副都心">新莊副都心</option>
            <option value="中原">中原</option>
            <option value="橋和">橋和</option>
            <option value="板新">板新</option>
            <option value="板橋">板橋</option>
            <option value="新埔民生">新埔民生</option>
            <option value="幸福">幸福</option>
            <option value="中和">中和</option>
            <option value="橋和">橋和</option>
            <option value="景平">景平</option>
            <option value="景安">景安</option>
            <option value="中和高中">中和高中</option>
            <option value="秀朗橋">秀朗橋</option>
            <option value="十四張">十四張</option>
          </optgroup>
        </select>
        <button className="query-button" onClick={fetchData}>查詢</button>
      </div>

      <div className="results">
        {paginated.map((rest) => (
          <Link
            to={`/restaurant/${rest.restaurant_id}`}
            key={rest.restaurant_id}
            className="card-link"
          >
            <div className="card">
              <img
                src={rest.cover || nullImage}
                alt={rest.name}
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = nullImage;
                }}
              />
              <div className="card-content">
                <h2>{rest.name}</h2>
                <p>{Array.isArray(rest.cuisine_type) ? rest.cuisine_type.join("、") : rest.cuisine_type} · {rest.district || "未知地區"}</p>
                <p>地址：{rest.address}</p>
                <p>評分：⭐ {rest.rating}</p>
              </div>
              <button
                className="favorite-btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (!user) {
                    alert("請先登入才能收藏餐廳！");
                    return;
                  }
                  handleToggleFavorite(user, rest.restaurant_id); // 改用新函數
                }}
              >
                {user && favorites.includes(rest.restaurant_id) ? "💖" : "🤍"}
              </button>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>« First</button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>&lt; Prev</button>
          {getVisiblePageNumbers(currentPage, totalPages).map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} style={{ margin: "0 6px" }}>...</span>
            ) : (
              <button key={p} onClick={() => setCurrentPage(p)} className={currentPage === p ? "active-page" : ""}>{p}</button>
            )
          )}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next &gt;</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last »</button>
        </div>
      )}

      <div className="pagination-controls">
        <label>
          每頁顯示：
          <select value={itemsPerPage} onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}>
            <option value={6}>6 筆</option>
            <option value={12}>12 筆</option>
            <option value={24}>24 筆</option>
            <option value={restaurants.length}>全部</option>
          </select>
        </label>
      </div>

      <div className="pagination-controls">
        <label>
          跳至第
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const page = parseInt(jumpPageInput, 10);
                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                } else {
                  alert("請輸入有效的頁數！");
                }
              }
            }}
          />
          頁
        </label>
        <button className="query-button" onClick={() => {
          const page = parseInt(jumpPageInput, 10);
          if (!isNaN(page) && page >= 1 && page <= totalPages) {
            setCurrentPage(page);
          } else {
            alert("請輸入有效的頁數！");
          }
        }}>Go</button>
      </div>
    </div>
  );
}