import { useEffect, useState } from "react";
import "./index.css";

export default function OwnerDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newImage, setNewImage] = useState("");

  const ownerId = localStorage.getItem("loggedInUser");

  useEffect(() => {
    async function fetchRestaurants() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurants?owner_id=${ownerId}`);
      const data = await res.json();
      // 同步查詢每家餐廳的圖片集
      const enrichedData = await Promise.all(
        data.map(async (r) => {
          const imgRes = await fetch(`${import.meta.env.VITE_API_URL}/api/images/${r.restaurant_id}`);
          const imgs = await imgRes.json();
          return { ...r, images: imgs.map((img) => img.image_url) };
        })
      );

      setRestaurants(enrichedData);
    }

    if (ownerId) fetchRestaurants();
  }, [ownerId]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelected((prev) => ({ ...prev, [name]: value }));
  };

  const saveChanges = async () => {
    if (!selected) return;

    const method = selected.restaurant_id ? "PUT" : "POST";
    const url = selected.restaurant_id
      ? `${import.meta.env.VITE_API_URL}/api/restaurants/${selected.restaurant_id}`
      : `${import.meta.env.VITE_API_URL}/api/restaurants`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...selected,
        ...(method === "POST" && { owner_id: ownerId }),
      }),
    });

    const result = await res.json();
    alert(result.message || (method === "POST" ? "新增成功" : "更新成功"));

    // 重新抓取資料
    const refreshed = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurants?owner_id=${ownerId}`);
    const updated = await refreshed.json();
    setRestaurants(updated);
    setSelected(null);
  };

  const uploadImage = async () => {
  if (!newImage || !selected?.restaurant_id) return;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: selected.restaurant_id,
        image_url: newImage
      })
    });

    const result = await res.json();
    if (res.ok) {
      setSelected((prev) => ({
        ...prev,
        images: [...(prev.images || []), newImage]
      }));
      setNewImage("");
    } else {
      alert("❌ 新增失敗：" + result.error);
    }
  };

  const handleDeleteImage = async (url) => {
    const confirmDelete = window.confirm("確定要刪除這張圖片嗎？");
    if (!confirmDelete) return;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/images/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: selected.restaurant_id,
        image_url: url
      })
    });

    const result = await res.json();
    if (res.ok) {
      setSelected((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img !== url)
      }));
    } else {
      alert("❌ 刪除失敗：" + result.error);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    const confirmDelete = window.confirm("確定要刪除這間餐廳嗎？此動作無法復原！");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurants/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("刪除失敗:", result);
        alert("❌ 刪除失敗：" + (result.error || "未知錯誤"));
        return;
      }

      alert("✅ 餐廳已成功刪除");

      // 重新更新餐廳清單
      const refreshed = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurants?owner_id=${ownerId}`);
      const updated = await refreshed.json();
      setRestaurants(updated);
      setSelected(null);
    } catch (err) {
      console.error("錯誤發生:", err);
      alert("❌ 無法刪除，請稍後再試");
    }
  };

  const startNewRestaurant = () => {
    setSelected({
      name: "",
      address: "",
      phone: "",
      price_range: "1",
      cuisine_type: "",
      rating: 0,
      cover: "",
      county: "",
      district: "",
      station_name: "",
    });
  };

  return (
    <div className="owner-section">
      <h2>我的餐廳</h2>

      {restaurants.length === 0 && !selected && (
        <div>
          <p>目前尚未有任何餐廳</p>
          <button className="add-button" onClick={startNewRestaurant}>
            新增第一間餐廳
          </button>
        </div>
      )}

      {restaurants.map((r) => (
        <div key={r.restaurant_id} className="restaurant-item">
          <strong>{r.name}</strong>（{r.district}）
          <button onClick={() => {
            if (selected?.restaurant_id === r.restaurant_id) {
              setSelected(null); // 若再次點擊相同餐廳，關閉編輯頁
            } else {
              setSelected(r); // 否則就進入該餐廳編輯頁
            }
          }}>
            編輯
          </button>
          <button
            onClick={() => handleDeleteRestaurant(r.restaurant_id)}
            style={{ marginLeft: "0.5rem", color: "red" }}
          >
            刪除
          </button>
        </div>
      ))}
      <br/>
      {!selected && restaurants.length > 0 && (
        <button className="add-button" onClick={startNewRestaurant}>
          新增餐廳
        </button>
      )}

      {selected && (
        <div className="edit-form">
          <label>名稱</label>
          <input name="name" value={selected.name} onChange={handleEditChange} />

          <label>地址</label>
          <input name="address" value={selected.address} onChange={handleEditChange} />

          <label>電話</label>
          <input name="phone" value={selected.phone} onChange={handleEditChange} />

          <label>價格範圍</label>
          <select name="price_range" value={selected.price_range} onChange={handleEditChange}>
            <option value="1">$0–200</option>
            <option value="2">$201–400</option>
            <option value="3">$401–600</option>
            <option value="4">$601–800</option>
            <option value="5">$801 以上</option>
          </select>

          <label>菜系（可複選）</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {[
              "Chinese 中式",
              "Japanese 日式",
              "Italian 義式",
              "Korean 韓式",
              "Brunch 早午餐",
              "Dessert 甜點",
              "Others 其他"
            ].map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  value={type}
                  checked={selected.cuisine_type?.split("、").includes(type) || false}
                  onChange={(e) => {
                    const selectedValues = selected.cuisine_type
                      ? selected.cuisine_type.split("、").filter(Boolean)
                      : [];
                    const updated = e.target.checked
                      ? [...selectedValues, type]
                      : selectedValues.filter((t) => t !== type);

                    setSelected((prev) => ({
                      ...prev,
                      cuisine_type: updated.join("、"),
                    }));
                  }}
                />
                {type}
              </label>
            ))}
          </div>

          <label>封面圖 URL</label>
          <input name="cover" value={selected.cover} onChange={handleEditChange} />

          <select name="district" value={selected.district} onChange={handleEditChange}>
            <option value="">請選擇地區</option>
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


          <label>捷運站</label>
          <select name="station_name" value={selected.station_name} onChange={handleEditChange}>
            <option value="">請選擇捷運站</option>
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
          <button onClick={saveChanges}>
            {selected?.restaurant_id ? "儲存變更" : "新增餐廳"}
          </button>
          {selected.restaurant_id && (
            <>
              <h4 style={{ marginTop: "2rem" }}>圖片集</h4>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {selected.images?.map((url, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <img
                      src={url}
                      alt={`圖片 ${idx + 1}`}
                      style={{
                        width: "150px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "5px"
                      }}
                    />
                    <button
                      onClick={() => handleDeleteImage(url)}
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "rgba(0,0,0,0.6)",
                        color: "white",
                        border: "none",
                        borderRadius: "0 5px 0 5px",
                        cursor: "pointer"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <h4 style={{ marginTop: "1.5rem" }}>新增圖片</h4>
              <input
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="圖片 URL"
              />
              <button onClick={uploadImage}>新增圖片</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}