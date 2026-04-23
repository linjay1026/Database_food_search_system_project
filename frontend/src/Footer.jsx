// src/Footer.jsx
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="about">
          <h3>關於我們 🍽</h3>
          <p>我們致力於在4天內以及隊友會突然睡著或消失的情況下，提供一個簡單、快速又實用的美食搜尋平台，幫助您輕鬆找到附近的熱門餐廳。</p>
          <p>不論是約會、家庭聚餐還是朋友聚會，只要輸入關鍵字，就能找到適合的好店。</p>
        </div>

        <div className="social">
          <h3>聯絡與連結</h3>
          <p>請給我們高分謝謝!</p>
          <p>電子信箱 : 41247018S@gapps.ntnu.edu.tw</p>
          <p>聯絡電話 : (02)7749-1188</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Copyright © 2025 ‧ 美食搜尋系統 ‧ All Rights Reserved</p>
      </div>
    </footer>
  );
}
