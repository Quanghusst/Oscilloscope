****# Mô phỏng Oscilloscope trên nền Web

Đây là một dự án mô phỏng cách tín hiệu hình sin được hiển thị trên màn hình của một máy hiện sóng (oscilloscope) sử dụng cơ chế quét răng cưa (sawtooth sweep). Dự án này được chuyển đổi từ mã nguồn MATLAB gốc sang HTML, CSS và JavaScript, sử dụng thư viện Chart.js để vẽ đồ thị.

Người dùng có thể điều chỉnh các tham số như pha ban đầu và thời gian quét để quan sát sự thay đổi của hình ảnh hiển thị trên màn hình mô phỏng.

## Tính năng chính

* **Hiển thị tín hiệu:** Vẽ đồ thị tín hiệu hình sin theo thời gian.
* **Mô phỏng quét:** Hiển thị quá trình quét thuận (`Tqt` - nét liền) và quét ngược (`Tqn` - nét đứt) của tia điện tử trên màn hình oscilloscope.
* **Tương tác người dùng:** Cho phép người dùng nhập các thông số:
    * Pha ban đầu (`phi`) tính bằng độ.
    * Hệ số xác định chu kỳ quét thuận (`Tqt = factor * Ty`).
    * Hệ số xác định chu kỳ quét ngược (`Tqn = factor * Ty`).
    * *(Hiện tại, tần số `f` và biên độ `A` đang được đặt cố định trong code)*.
* **Tính toán và hiển thị:** Tự động tính toán và hiển thị các thông số liên quan như:
    * Chu kỳ tín hiệu (`Ty`).
    * Các chu kỳ quét (`Tqt`, `Tqn`, `T_sweep`).
    * Tỷ lệ `T_sweep / Ty`.
    * Phân số tối giản `n/m` của tỷ lệ, xác định số chu kỳ quét (`m`) và số chu kỳ tín hiệu (`n`) để hình ảnh lặp lại hoàn toàn.
* **Đồ thị động:** Biểu đồ được cập nhật tự động khi người dùng thay đổi thông số và nhấn nút "Cập nhật Biểu đồ".

## Công nghệ sử dụng

* **HTML:** Cấu trúc trang web, các trường nhập liệu và phần tử canvas.
* **CSS:** Định dạng giao diện, bố cục và kiểu dáng cho các thành phần.
* **JavaScript:** Xử lý logic, tính toán các tham số, tương tác người dùng và điều khiển việc vẽ đồ thị.
* **Chart.js:** Thư viện JavaScript dùng để vẽ biểu đồ đường (line chart) một cách linh hoạt và đẹp mắt.

## Hướng dẫn sử dụng

1.  **Tải mã nguồn:** Tải về hoặc clone repository này về máy tính của bạn.
2.  **Mở file HTML:** Mở file `index.html` bằng trình duyệt web (ví dụ: Chrome, Firefox, Edge).
3.  **Tương tác:**
    * Xem biểu đồ hiển thị mặc định.
    * Thay đổi các giá trị trong các ô nhập liệu (Pha đầu, Hệ số Tqt, Hệ số Tqn).
    * Nhấn nút **"Cập nhật Biểu đồ"**.
    * Quan sát sự thay đổi của đồ thị và các thông số tính toán được hiển thị bên dưới.

## Cấu trúc file

* `index.html`: File HTML chính, chứa cấu trúc giao diện người dùng (input, button, canvas) và nhúng các file CSS, JS.
* `style.css`: File CSS, chứa các quy tắc định dạng cho giao diện.
* `script.js`: File JavaScript chính, chứa toàn bộ logic xử lý:
    * Lấy giá trị input từ người dùng.
    * Thực hiện các phép tính toán (chu kỳ, tỷ lệ, phân số tối giản `n/m`).
    * Chuẩn bị dữ liệu cho Chart.js.
    * Vẽ và cập nhật biểu đồ bằng Chart.js.
    * Hiển thị thông tin tính toán.

## Giải thích Tham số và Tính toán

* **`f` (Tần số):** Tần số của tín hiệu hình sin (Hz).
* **`A` (Biên độ):** Biên độ cực đại của tín hiệu hình sin.
* **`phi` (Pha đầu):** Pha ban đầu của tín hiệu sin tại thời điểm `t=0` (nhập bằng độ, chuyển sang radian khi tính toán).
* **`Ty` (Chu kỳ tín hiệu):** `Ty = 1 / f`.
* **`Tqt` (Chu kỳ quét thuận):** Thời gian tia quét đi từ trái sang phải màn hình. Được tính bằng `Hệ số Tqt * Ty`.
* **`Tqn` (Chu kỳ quét ngược/Flyback):** Thời gian tia quét quay về từ phải sang trái (thường nhanh hơn). Được tính bằng `Hệ số Tqn * Ty`.
* **`T_sweep` (Tổng chu kỳ quét):** `T_sweep = Tqt + Tqn`.
* **`ratio` (Tỷ lệ):** `ratio = T_sweep / Ty`. Tỷ lệ này quyết định mối quan hệ về pha giữa tín hiệu và quá trình quét.
* **`n / m` (Phân số tối giản):** Kết quả từ hàm `rationalApproximation(ratio)`.
    * `m`: Số chu kỳ quét (`T_sweep`) cần thiết để hình ảnh trên màn hình lặp lại chính xác trạng thái ban đầu.
    * `n`: Số chu kỳ tín hiệu (`Ty`) tương ứng với `m` chu kỳ quét đó. Điều kiện lặp lại: `m * T_sweep = n * Ty`.

## Hướng phát triển tiềm năng

* Cho phép người dùng nhập cả tần số `f` và biên độ `A`.
* Thêm các dạng tín hiệu khác (vuông, tam giác).
* Mô phỏng cơ chế trigger (kích) của oscilloscope.
* Thêm chức năng zoom/pan cho biểu đồ.
* Cải thiện giao diện người dùng.

---

Hy vọng mô phỏng này hữu ích cho việc hình dung hoạt động cơ bản của oscilloscope!