
document.addEventListener('DOMContentLoaded', () => {
    const getById = id => document.getElementById(id);
    const fInput = getById('fInput');
    const aInput = getById('aInput');
    const phiInput = getById('phiInput');
    const tqtFactorInput = getById('tqtFactorInput');
    const tqnFactorInput = getById('tqnFactorInput');
    const updateButton = getById('updateButton');
    const calcInfoElement = getById('calc-info');
    const ctx = getById('oscilloscopeChart').getContext('2d');
    const inputCtx = document.getElementById('inputSignalChart').getContext('2d');
    const sweepCtx = document.getElementById('sweepSignalChart').getContext('2d');

    let oscilloscopeChart = null;
    let inputSignalChart = null;
    let sweepSignalChart = null;
    const numPoints = 200;
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

    const linspace = (start, end, num) => {
        const step = (end - start) / (num - 1);
        return Array.from({ length: num }, (_, i) => start + i * step);
    };

    const gcd = (a, b) => {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) [a, b] = [b, a % b];
        return a;
    };

    const rationalApproximation = (target, tolerance = 1e-10) => {
        if (target === 0) return { n: 0, m: 1 };
        if (!isFinite(target) || isNaN(target)) return { n: Math.sign(target) || 0, m: 0 };

        let [num, den] = [0, 1], [numPrev, denPrev] = [1, 0], x = target, iterations = 0;
        const maxIterations = 100;

        while (Math.abs(target - num / den) > tolerance * Math.abs(target) &&
               isFinite(x) && iterations++ < maxIterations) {
            const a = Math.floor(x);
            [num, numPrev] = [a * num + numPrev, num];
            [den, denPrev] = [a * den + denPrev, den];

            if (den > 1e6) break;
            x = 1 / (x - a);
        }

        if (den === 0) return { n: Math.sign(target) || 0, m: 0 };
        if (den < 0) [num, den] = [-num, -den];

        const d = gcd(num, den);
        return { m: num / d, n: den / d };
    };

    function updateChart() {
        const f = parseFloat(fInput.value) || 0;
        const A = parseFloat(aInput.value) || 0;
        const phiDeg = parseFloat(phiInput.value) || 0;
        const TqtFactor = parseFloat(tqtFactorInput.value) || 0;
        const TqnFactor = parseFloat(tqnFactorInput.value) || 0;

        if (f <= 0 || A <= 0 || TqtFactor < 0 || TqnFactor < 0) {
            alert("Giá trị nhập không hợp lệ.");
            return;
        }

        const phi = phiDeg * Math.PI / 180;
        const Ty = 1 / f;
        const Tqt = TqtFactor * Ty;
        const Tqn = TqnFactor * Ty;

        if (Tqt <= 0) {
            alert("Chu kỳ quét thuận (Tqt) phải lớn hơn 0.");
            calcInfoElement.textContent = "Lỗi: Tqt phải > 0";
            oscilloscopeChart?.destroy();
            oscilloscopeChart = null;
            return;
        }

        const T_sweep = Tqt + Tqn;
        const ratio = T_sweep / Ty;
        const { n: n_sync, m: m_iterations } = rationalApproximation(ratio);

        if (m_iterations <= 0) {
            alert(`Không thể tìm được phân số hợp lý cho T_sweep/Ty = ${ratio.toFixed(4)}`);
            calcInfoElement.textContent = `Lỗi tính toán tỷ lệ n/m cho ratio = ${ratio.toFixed(4)}`;
            oscilloscopeChart?.destroy();
            oscilloscopeChart = null;
            return;
        }

        // Vẽ x(t)
        const t_xt = linspace(0, T_sweep, numPoints);
        const x_xt = t_xt.map(t => (t <= Tqt) ? t / Tqt : 1 - (t - Tqt) / Tqn);
        // const x_xt = t_xt.map(t => t / Tqt );

        const sweepData = {
            labels: t_xt,
            datasets: [{
                label: "x(t) – tín hiệu quét răng cưa",
                data: t_xt.map((t, i) => ({ x: t, y: x_xt[i] })),
                borderColor: '#FF9F40',
                fill: false,
                tension: 0.1,
                pointRadius: 0
            }]
        };

        const sweepOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Tín hiệu quét x(t)' },
                legend: { display: false }
            },
            scales: {
                // x: { title: { display: true, text: 'Thời gian (s)' } },
            x: {
                type: 'linear',
                title: { display: true, text: 'Thời gian (s)' },
                min: 0,
                max: T_sweep // cố định trục t từ 0 đến T_sweep
            },
                y: { title: { display: true, text: 'Biên độ' }, min: 0, max: 1.2 }
            },
            animation: { duration: 0 }
        };

        if (sweepSignalChart) sweepSignalChart.destroy();
        sweepSignalChart = new Chart(sweepCtx, {
            type: 'line',
            data: sweepData,
            options: sweepOptions
        });

        // Vẽ y(t)
        const t_input = linspace(0, T_sweep, numPoints);
        const y_input = t_input.map(t => A * Math.sin(2 * Math.PI * f * t + phi));

        const inputSignalData = {
            labels: t_input,
            datasets: [{
                label: "y(t) = A·sin(2π·f·t + φ)",
                data: t_input.map((x, i) => ({ x, y: y_input[i] })),
                borderColor: '#4BC0C0',
                fill: false,
                tension: 0.1,
                pointRadius: 0
            }]
        };

        const inputOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Tín hiệu đầu vào y(t)' },
                legend: { display: false }
            },
            scales: {
                // x: { type: 'linear', title: { display: true, text: 'Thời gian (s)' } },
            x: {
                type: 'linear',
                title: { display: true, text: 'Thời gian (s)' },
                min: 0,
                max: T_sweep // cố định trục t từ 0 đến T_sweep
            },
                y: { title: { display: true, text: 'Biên độ' }, min: -A * 1.1, max: A * 1.1 }
            },
            animation: { duration: 0 }
        };

        if (inputSignalChart) inputSignalChart.destroy();
        inputSignalChart = new Chart(inputCtx, {
            type: 'line',
            data: inputSignalData,
            options: inputOptions
        });

        // Vẽ oscilloscope
        const t_qt = linspace(0, Tqt, numPoints);
        const t_qn = linspace(0, Tqn, numPoints);
        const datasets = [];

        for (let i = 0; i < m_iterations; i++) {
            const tOffset = i * T_sweep;
            const yqt = t_qt.map(t => A * Math.sin(2 * Math.PI * f * (t + tOffset) + phi));
            const yqn = t_qn.map(t => A * Math.sin(2 * Math.PI * f * (t + tOffset) + phi));
            const color = colors[i % colors.length];

            datasets.push({
                label: `Tqt ${i + 1}`,
                data: t_qt.map((x, idx) => ({ x, y: yqt[idx] })),
                borderColor: color,
                borderWidth: 1.5,
                fill: false,
                tension: 0.1,
                pointRadius: 0
            });

            if (Tqn > 0) {
                datasets.push({
                    label: `Tqn ${i + 1}`,
                    data: t_qt.map((x, idx) => ({ x, y: yqn[idx] })),
                    borderColor: color,
                    borderDash: [5, 5],
                    borderWidth: 1,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0
                });
            }
        }

        const chartData = { datasets };
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
                    title: { display: true, text: 'Thời gian (trục quét thuận)' },
                    min: 0,
                    max: Tqt
                },
                y: {
                    title: { display: true, text: 'Biên độ' },
                    min: -A * 1.1,
                    max: A * 1.1
                }
            },
            animation: { duration: 0 }
        };

        if (oscilloscopeChart) oscilloscopeChart.destroy();
        oscilloscopeChart = new Chart(ctx, { type: 'line', data: chartData, options: chartOptions });

        // Hiển thị thông tin
        calcInfoElement.textContent = `--- Thông số đầu vào ---
Tần số f = ${f} Hz
Biên độ A = ${A}
Pha đầu φ = ${phiDeg}° (${phi.toFixed(4)} rad)
Hệ số Tqt = ${TqtFactor}
Hệ số Tqn = ${TqnFactor}
--- Tính toán ---
Ty = ${Ty.toFixed(4)} s
Tqt = ${Tqt.toFixed(4)} s
Tqn = ${Tqn.toFixed(4)} s
T_sweep = ${T_sweep.toFixed(4)} s
T_sweep / Ty = ${isFinite(ratio) ? ratio.toFixed(4) : '∞'}
Phân số tối giản n/m = ${n_sync} / ${m_iterations}
→ m * T_sweep = ${(m_iterations * T_sweep).toFixed(4)} s
→ n * Ty = ${(n_sync * Ty).toFixed(4)} s`;
    }

    updateButton.addEventListener('click', updateChart);
    updateChart();
});
