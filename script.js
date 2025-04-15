document.addEventListener('DOMContentLoaded', () => {
    // --- Tham chiếu đến các phần tử DOM ---
    const fInput = document.getElementById('fInput');
    const aInput = document.getElementById('aInput');
    const phiInput = document.getElementById('phiInput');
    const tqtFactorInput = document.getElementById('tqtFactorInput');
    const tqnFactorInput = document.getElementById('tqnFactorInput');
    const updateButton = document.getElementById('updateButton');
    const calcInfoElement = document.getElementById('calc-info');
    const ctx = document.getElementById('oscilloscopeChart').getContext('2d');

    let oscilloscopeChart = null; // Biến để lưu trữ đối tượng Chart

    const numPoints = 200;    // Số điểm dữ liệu để vẽ
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']; // Mảng màu

    // --- Hàm tiện ích ---
    function linspace(start, end, num) {
        if (num <= 1) return [start];
        const step = (end - start) / (num - 1);
        const arr = [];
        for (let i = 0; i < num; i++) {
            arr.push(start + i * step);
        }
        return arr;
    }

    function rationalApproximation(target, tolerance = 1e-10) {
         // Xử lý trường hợp target là 0 hoặc vô cùng hoặc NaN
         if (target === 0) return { n: 0, m: 1 };
         if (!isFinite(target) || isNaN(target)) return { n: Math.sign(target) || 0, m: 0 }; // Trả về m=0 để báo lỗi

        let num = 0, den = 1;
        let num_prev = 1, den_prev = 0;
        let x = target;
        let iterations = 0;
        const maxIterations = 100; // Ngăn vòng lặp vô hạn

        do {
            const a = Math.floor(x);
            let num_new = a * num + num_prev;
            let den_new = a * den + den_prev;

            // Kiểm tra tràn số tiềm năng (có thể không cần thiết trong JS hiện đại)
             // if (!Number.isSafeInteger(num_new) || !Number.isSafeInteger(den_new)) {
             //    console.warn("Potential overflow in rationalApproximation");
             //    break;
             // }

            num_prev = num;
            den_prev = den;
            num = num_new;
            den = den_new;

            // Giới hạn mẫu số để tránh quá lớn
            if (den > 1000000) {
                console.warn("Denominator getting large in rationalApproximation, might stop early.");
                break;
            }

            x = 1 / (x - a);
            iterations++;

        } while (Math.abs(target - num / den) > tolerance * Math.abs(target) && isFinite(x) && iterations < maxIterations);

         // Nếu mẫu số là 0 sau vòng lặp (ví dụ: target quá lớn), trả về m=0
        if (den === 0) return { n: Math.sign(target) || 0, m: 0 };


        // Đảm bảo mẫu số dương
        if (den < 0) {
            num = -num;
            den = -den;
        }

        function gcd(a, b) {
            a = Math.abs(a);
            b = Math.abs(b);
            while (b) {
                [a, b] = [b, a % b];
            }
            return a;
        }

        // Nếu num hoặc den là 0, gcd sẽ trả về số khác 0, không cần xử lý đặc biệt
        const commonDivisor = gcd(num, den);
        // Tránh chia cho 0 nếu commonDivisor là 0 (chỉ xảy ra nếu num và den đều là 0)
        if (commonDivisor === 0) return { n: 0, m: 1};

        return { m: num / commonDivisor, n: den / commonDivisor };
    }


    // --- Hàm chính để tính toán và vẽ biểu đồ ---
    function updateChart() {
        // --- Lấy giá trị từ input ---
        const f = parseFloat(fInput.value) || 0;
        const A = parseFloat(aInput.value) || 0;
        const phiDegrees = parseFloat(phiInput.value) || 0;
        const Tqt_factor = parseFloat(tqtFactorInput.value) || 0;
        const Tqn_factor = parseFloat(tqnFactorInput.value) || 0;

        // --- Kiểm tra giá trị đầu vào cơ bản ---
        if (f <= 0) {
            alert("Tần số (f) phải lớn hơn 0.");
            return;
        }
        if (A <= 0) {
             alert("Biên độ (A) phải lớn hơn 0.");
             return;
        }
         if (Tqt_factor < 0 || Tqn_factor < 0) {
             alert("Hệ số Tqt và Tqn không được âm.");
             return;
         }


        // --- Tính toán các tham số ---
        const phi = phiDegrees * Math.PI / 180; // Chuyển độ sang radian
        const Ty = 1 / f;
        const Tqt = Tqt_factor * Ty;
        const Tqn = Tqn_factor * Ty;

        // Xử lý trường hợp Tqt = 0 (quét tức thời)
        if (Tqt <= 0) {
            alert("Chu kỳ quét thuận (Tqt) phải lớn hơn 0.");
            // Có thể vẽ một đường thẳng đứng nếu muốn, nhưng ở đây chỉ báo lỗi
             calcInfoElement.textContent = "Lỗi: Tqt phải > 0";
             if (oscilloscopeChart) {
                 oscilloscopeChart.destroy(); // Xóa biểu đồ cũ nếu có lỗi
                 oscilloscopeChart = null;
             }
            return;
        }

        const T_sweep = Tqt + Tqn;
         // Xử lý trường hợp T_sweep = 0 (nếu Tqt>0 thì Tqn phải >= -Tqt)
         // Do đã kiểm tra Tqn_factor >= 0 nên T_sweep luôn >= Tqt > 0

        const ratio = (Ty === 0) ? Infinity : T_sweep / Ty; // Tránh chia cho 0 nếu f=Infinity

        // --- Tính toán số lần lặp ---
        const { n: n_sync, m: m_iterations } = rationalApproximation(ratio);

        // --- Kiểm tra kết quả từ rationalApproximation ---
        if (m_iterations <= 0) {
             alert(`Không thể tìm thấy phân số hợp lý cho tỷ lệ T_sweep/Ty = ${ratio.toFixed(4)}. Có thể giá trị quá lớn hoặc không xác định.`);
             calcInfoElement.textContent = `Lỗi tính toán tỷ lệ n/m cho ratio = ${ratio.toFixed(4)}`;
              if (oscilloscopeChart) {
                 oscilloscopeChart.destroy();
                 oscilloscopeChart = null;
             }
             return;
        }

        // --- Chuẩn bị dữ liệu cho biểu đồ ---
        const t_qt = linspace(0, Tqt, numPoints);
        const t_qn = linspace(Tqn, 0, numPoints); // Vẫn đi ngược từ Tqn về 0

        const datasets = [];

        // --- Vòng lặp tạo dữ liệu vẽ ---
        for (let i = 0; i < m_iterations; i++) {
             // Tính y(t) tại thời điểm tương ứng trên màn hình
             // Thời gian thực bắt đầu của lần quét thuận thứ i: i * T_sweep
             // Thời gian thực bắt đầu của lần quét ngược thứ i: i * T_sweep + Tqt
            //  const yqt = t_qt.map(t => A * Math.sin(2 * Math.PI * f * (t + i * T_sweep) + phi));
             const yqt = t_qt.map(t => A * Math.sin(2 * Math.PI * f * (t + i * Tqn) + phi));
             // Thời gian tương đối trong quét ngược là Tqn - t', với t' từ 0 đến Tqn
             // t_qn[index] tương ứng với giá trị thời gian *ngược* từ Tqn về 0.
             // Thời gian thực = thời gian bắt đầu quét ngược + thời gian đã trôi qua trong quét ngược
             // Thời gian đã trôi qua = Tqn - t_qn[index] (vì t_qn[index] chạy ngược)
             // -> t_real = i * T_sweep + Tqt + (Tqn - t_qn[index]) // Logic này phức tạp hơn cần thiết
             // Cách dễ hơn: Dùng mảng t_qn_forward = linspace(0, Tqn, numPoints)
             // t_real = i * T_sweep + Tqt + t_qn_forward[index]
             // yqn = t_qn_forward.map(t_flyback => A * Math.sin(2 * Math.PI * f * (i * T_sweep + Tqt + t_flyback) + phi));

             // Giữ logic như bản dịch trước, ánh xạ thời gian quét ngược vào trục quét thuận:
            //  const yqn = t_qn.map(t => A * Math.sin(2 * Math.PI * f * (i * T_sweep + Tqt + (Tqn-t)) + phi)); // dùng (Tqn-t) để có thời gian chạy xuôi trong khoảng [0, Tqn]
             const yqn = t_qn.map(t => A * Math.sin(2 * Math.PI * f * (i * Tqn + t) + phi)); // dùng (Tqn-t) để có thời gian chạy xuôi trong khoảng [0, Tqn]


             const colorIndex = i % colors.length;

            datasets.push({
                label: `Tqt ${i + 1}`,
                data: yqt.map((y, index) => ({ x: t_qt[index], y: y })),
                borderColor: colors[colorIndex],
                borderWidth: 1.5,
                fill: false,
                tension: 0.1,
                pointRadius: 0
            });

            // Chỉ vẽ quét ngược nếu Tqn > 0
            if (Tqn > 0) {
                datasets.push({
                    label: `Tqn ${i + 1}`,
                    data: yqn.map((y, index) => ({ x: t_qt[index], y: y })), // Vẽ yqn trên trục t_qt
                    borderColor: colors[colorIndex],
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0
                });
            }
        }

        // --- Cập nhật hoặc tạo biểu đồ ---
        const chartData = { datasets: datasets };
        const yAxisMin = A === 0 ? -1 : -A * 1.1;
        const yAxisMax = A === 0 ? 1 : A * 1.1;


        if (oscilloscopeChart) {
            // Cập nhật biểu đồ hiện có
            oscilloscopeChart.data = chartData;
            oscilloscopeChart.options.scales.x.max = Tqt; // Cập nhật giới hạn trục x
             oscilloscopeChart.options.scales.y.min = yAxisMin; // Cập nhật giới hạn trục y
             oscilloscopeChart.options.scales.y.max = yAxisMax;
            oscilloscopeChart.update();
        } else {
            // Tạo biểu đồ mới
            const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'MÀN HÌNH OSCILLOSCOPE (JS/Chart.js)' },
                    legend: { position: 'top' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: { display: true, text: 'Thời gian (trục thời gian của quét thuận)' },
                        min: 0,
                        max: Tqt // Đặt giới hạn trục x
                    },
                    y: {
                        title: { display: true, text: 'Biên độ' },
                        min: yAxisMin, // Đặt giới hạn trục y
                        max: yAxisMax
                    }
                },
                animation: { duration: 0 }
            };
            oscilloscopeChart = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: chartOptions
            });
        }

        // --- Hiển thị thông tin tính toán ---
        calcInfoElement.textContent = `--- Thông số đầu vào ---
Tần số f = ${f} Hz
Biên độ A = ${A}
Pha đầu φ = ${phiDegrees} độ (${phi.toFixed(4)} rad)
Hệ số Tqt = ${Tqt_factor}
Hệ số Tqn = ${Tqn_factor}
--- Tính toán ---
Chu kỳ sóng sin Ty = ${Ty.toFixed(4)} s
Chu kỳ quét thuận Tqt = ${Tqt.toFixed(4)} s
Chu kỳ quét ngược Tqn = ${Tqn.toFixed(4)} s
Tổng chu kỳ quét T_sweep = ${T_sweep.toFixed(4)} s
Tỷ lệ T_sweep / Ty = ${isFinite(ratio) ? ratio.toFixed(4) : 'Infinity'}
Phân số tối giản (n/m) = ${n_sync} / ${m_iterations}
=> Số lần lặp cần thiết (m) = ${m_iterations}
=> Số chu kỳ sóng sin tương ứng (n) = ${n_sync}
---------------------------------
Kiểm tra: m * T_sweep = ${(m_iterations * T_sweep).toFixed(4)}
Kiểm tra: n * Ty = ${(n_sync * Ty).toFixed(4)}`;
    }

    // --- Gắn sự kiện cho nút bấm ---
    updateButton.addEventListener('click', updateChart);

    // --- Vẽ biểu đồ lần đầu khi tải trang ---
    updateChart();
});