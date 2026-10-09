# Mỹ thuật theo mẫu người dùng

Gói tham chiếu: Build_City_26_Giao_Dien.zip, 4 ảnh màn chơi/trang chủ/đăng ký/đăng nhập. Dùng bố cục, màu xanh đêm/xanh ngọc/vàng, typography và nhịp khoảng cách làm hướng dẫn; không dùng toàn screenshot làm UI hay nền game. UI là HTML/CSS có tác vụ thật. BXH và các hệ thống chưa triển khai không có nút giả.

Ảnh minh họa gốc riêng tạo bằng **built-in imagegen**, lưu public/art/coastal-city-v1.webp (1672×941, 481.128 byte). Chỉ export WebP80 bằng Pillow; không sửa nội dung bằng Python. Ảnh tải ở trang chủ/auth, không là texture WebGL và không đóng vai bản đồ/địa hình. Game không phụ thuộc API AI.

## Prompt cuối

Use case: stylized-concept. Asset type: original Build City 26 website coastal-city background, widescreen 16:9. Reference image: the supplied image is visual art direction only; create an original illustration in this polished sunlit 3D miniature city style with Vietnamese seaside architecture, white and cream buildings, orange tiled roofs, palm-lined boulevards, waterfront park and fountain in foreground, turquoise bay, cable-stayed bridge across bay and lush mountainous islands beyond, small buses and boats. Composition: aerial oblique view with foreground buildings and waterfront flowing toward right, clean blue sky along top; visually rich but coherent, realistic attractive materials and golden morning light. This must be PURE CITY ART with absolutely no typography, letters, numbers, logos, branding, UI panels, buttons, borders, menus, HUD, or watermark. No game assets from existing commercial games. Match the reference warmth, architecture and art quality, creating a new original scene. Render a complete clean full-bleed wide scene; no dark overlay, since the website adds overlays in CSS.

## Bằng chứng

reference-home.png, reference-register.png, reference-login.png chụp UI thật. Model thành phố dùng procedural primitives riêng; chưa đạt chất lượng photoreal của ảnh concept. Không tuyên bố ảnh nền minh họa là gameplay.
