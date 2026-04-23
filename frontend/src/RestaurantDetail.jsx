import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";
import nullImage from "./data/null_image.png";

function getPriceRangeString(priceRange) {
  switch (priceRange) {
    case "$":
      return "$0 - $200";
    case "$$":
      return "$201 - $400";
    case "$$$":
      return "$401 - $600";
    case "$$$$":
      return "$601 - $800";
    case "$$$$$":
      return "$801 以上";
    default:
      return "價格資訊不詳";
  }
}


export default function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  const storedUserId = localStorage.getItem("loggedInUser");
  const loggedInUser = storedUserId ? Number(storedUserId) : null;

  useEffect(() => {
    async function fetchRestaurant() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurants/${id}`);
      const json = await res.json();
      setRestaurant(json);
    }

    async function fetchPhotos() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/images/${id}`);
      const json = await res.json();
      setPhotos(json.map((img) => img.image_url));
    }

    async function fetchReviews() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${id}`);
      const json = await res.json();
      setReviews(json);

      const existing = json.find((r) => r.user_id === loggedInUser);
      if (existing) {
        setNewRating(existing.rating);
        setNewComment(existing.comment);
      }
    }

    fetchRestaurant();
    fetchPhotos();
    fetchReviews();
  }, [id, loggedInUser]);

  useEffect(() => {
    const existing = reviews.find((r) => r.user_id === loggedInUser);
    if (existing) {
      setNewRating(existing.rating);
      setNewComment(existing.comment);
    }
  }, [reviews, loggedInUser]);

  async function handleSubmitReview() {
    if (!newComment.trim()) {
      alert("請填寫評論內容");
      return;
    }

    const existing = reviews.find((r) => r.user_id === loggedInUser);

    const payload = {
      user_id: loggedInUser,
      restaurant_id: id,
      rating: newRating,
      comment: newComment,
      review_date: new Date().toISOString().split("T")[0],
    };

    const method = existing ? "PUT" : "POST";
    const url = existing
      ? `${import.meta.env.VITE_API_URL}/api/reviews/${existing.review_id}`
      : `${import.meta.env.VITE_API_URL}/api/reviews`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("後端未回傳 JSON，可能是路徑錯誤或伺服器錯誤");
      }

      const result = await res.json();
      if (res.ok) {
        alert(existing ? "✅ 評論已更新" : "✅ 已新增評論");
        setNewComment("");
        const newRes = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${id}`);
        setReviews(await newRes.json());
      } else {
        alert(`❌ 操作失敗：${result.error}`);
      }
    } catch (err) {
      alert("❌ 發生錯誤：" + err.message);
    }
  }

  if (!restaurant) return <p>載入中...</p>;

  return (
    <div className="container">
      <br />
      <h1>{restaurant.name}</h1>

      {photos.length > 0 && (
        <Swiper
          modules={[Navigation, EffectCoverflow]}
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          navigation
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 150,
            modifier: 2.5,
            slideShadows: true,
          }}
          className="photo-carousel"
          style={{ paddingBottom: "3rem" }}
        >
          {photos.map((photoUrl, idx) => (
            <SwiperSlide key={idx} style={{
              width: "600px",
              height: "400px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
              <img
                src={photoUrl}
                alt={`餐廳圖片 ${idx + 1}`}
                onError={(e) => { e.target.src = nullImage }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "10px",
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <div className="detail-info">
        <h3><strong>類型：</strong>{restaurant.cuisine_type || "無資料"}</h3>
        <h3><strong>地區：</strong>{restaurant.district}</h3>
        <h3><strong>地址：</strong>{restaurant.address}</h3>
        <h3><strong>電話：</strong>{restaurant.phone}</h3>
        <h3><strong>價格範圍：</strong>{getPriceRangeString(restaurant.price_range)}</h3>
        <h3><strong>評分：</strong>⭐ {restaurant.rating}</h3>
      </div>

      <h2>評論區</h2>
      {reviews.length > 0 ? (
        <div style={{ textAlign: "left", maxWidth: "600px", margin: "0 auto" }}>
          {reviews.map((review, index) => (
            <div key={index} style={{ marginBottom: "1.5rem", borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>
              <p><strong>{review.username}</strong>（{new Date(review.review_date).toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" })}）</p>
              <p>評分：⭐ {review.rating}</p>
              <p>{review.comment.split("\n").map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}</p>
            </div>
          ))}
        </div>
      ) : <p style={{ textAlign: "center" }}>尚無評論</p>}

      <hr style={{ margin: "2rem 0" }} />

      {loggedInUser ? (
        <div className="review-form">
          <h2>{reviews.find(r => r.user_id === loggedInUser) ? "修改評論" : "撰寫評論"}</h2>

          <label>評分：</label>
          <select value={newRating} onChange={(e) => setNewRating(e.target.value)}>
            {[5, 4, 3, 2, 1].map((num) => (
              <option key={num} value={num}>⭐ {num}</option>
            ))}
          </select>

          <label>評論內容：</label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />

          <button onClick={handleSubmitReview}>送出評論</button>
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "gray", marginTop: "2rem" }}>
          請先登入才能撰寫評論
        </p>
      )}
    </div>
  );
}