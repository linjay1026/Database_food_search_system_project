import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import nullImage from './data/null_image.png';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const userId = Number(localStorage.getItem("loggedInUser"));

  // 初次載入：從後端拉收藏清單
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/${userId}`);
        if (!res.ok) throw new Error("無法取得收藏清單");
        const data = await res.json();
        setFavorites(data);
      } catch (err) {
        console.error("載入收藏失敗：", err);
      }
    }

    if (userId) fetchFavorites();
  }, [userId]);

  // 加入 / 移除 收藏
  const handleToggleFavorite = async (restaurantId) => {
    const isAlreadyFavorite = favorites.some(r => r.restaurant_id === restaurantId);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
        method: isAlreadyFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, restaurant_id: restaurantId }),
      });

      if (!res.ok) throw new Error(await res.text());

      // 重新拉資料
      const updated = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/${userId}`).then(r => r.json());
      setFavorites(updated);
    } catch (err) {
      alert("❌ 操作失敗：" + err.message);
    }
  };

  if (!userId) return <p style={{ textAlign: "center" }}>請先登入以查看收藏</p>;

  return (
    <div className="container">
      <h1>❤️ 我的收藏餐廳 ❤️</h1>
      {favorites.length === 0 ? (
        <p>尚未收藏任何餐廳，趕快去新增！</p>
      ) : (
        <div className="results">
          {favorites.map((rest) => (
            <Link to={`/restaurant/${rest.restaurant_id}`} key={rest.restaurant_id} className="card-link">
              <div className="card">
                <img
                  src={rest.cover || nullImage}
                  alt={rest.name}
                  loading="lazy"
                />
                <div className="card-content">
                  <h2>{rest.name}</h2>
                  <p>{rest.cuisine_type} · {rest.district}</p>
                  <p>地址：{rest.address}</p>
                  <p>評分：⭐ {rest.rating}</p>
                </div>
                <button
                  className="favorite-btn"
                  onClick={(e) => {
                    e.preventDefault(); // 不觸發 Link
                    handleToggleFavorite(rest.restaurant_id);
                  }}
                >
                  💖
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}