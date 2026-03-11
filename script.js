// ——— Константы цен (руб за единицу) ———
const PRICES = {
  sillPerM2: 1600,
  starterPerM: 30,
  panelPerM2: 600,
  cornerPerM: 70,
  dripPerM2: 1800,
};

// ——— Расчёт материалов ———
function calculateMaterials({ windowWidth, windowHeight, openingDepth, unit = 'mm' }) {
  const UNIT_FACTORS = { mm: 1, cm: 10 };
  const factor = UNIT_FACTORS[unit] || 1;

  const widthMm = Number(windowWidth) * factor;
  const heightMm = Number(windowHeight) * factor;
  const depthMm = Number(openingDepth) * factor;

  if (!widthMm || !heightMm || !depthMm || widthMm <= 0 || heightMm <= 0 || depthMm <= 0) {
    throw new Error('Все размеры должны быть положительными числами.');
  }

  const STANDARD_SILL_WIDTH_MM = 400;
  const STANDARD_DRIP_WIDTH_MM = 150;

  function roundUpToTenthMeter(mm) {
    const meters = mm / 1000;
    const roundedMeters = Math.ceil(meters * 10) / 10;
    return Math.round(roundedMeters * 1000);
  }

  const rawSillLengthMm = widthMm + 200;
  const sillLengthMm = roundUpToTenthMeter(rawSillLengthMm);
  const sillWidthMm = depthMm <= STANDARD_SILL_WIDTH_MM ? depthMm : STANDARD_SILL_WIDTH_MM;
  const sillAreaM2 = (sillLengthMm * sillWidthMm) / 1_000_000;

  const panelsWidthMm = depthMm;
  const panelVerticalLengthMm = heightMm + 100;
  const panelTopLengthMm = widthMm + 200;
  const panelsTotalLengthMm = 2 * panelVerticalLengthMm + panelTopLengthMm;
  const panelsAreaM2 = (panelsWidthMm * panelsTotalLengthMm) / 1_000_000;

  const starterProfilePositions = [
    { lengthMm: heightMm, count: 2 },
    { lengthMm: widthMm, count: 1 },
  ];
  const starterTotalLengthMm = starterProfilePositions.reduce(
    (sum, p) => sum + p.lengthMm * p.count,
    0
  );

  const cornerVerticalLengthMm = panelVerticalLengthMm + 100;
  const cornerTopLengthMm = panelTopLengthMm + 100;
  const finishingCornerPositions = [
    { lengthMm: cornerVerticalLengthMm, count: 2 },
    { lengthMm: cornerTopLengthMm, count: 1 },
  ];
  const cornerTotalLengthMm = finishingCornerPositions.reduce(
    (sum, p) => sum + p.lengthMm * p.count,
    0
  );

  const dripLengthMm = widthMm + 200;
  const dripWidthMm = STANDARD_DRIP_WIDTH_MM;
  const dripAreaM2 = (dripLengthMm * dripWidthMm) / 1_000_000;

  return {
    'подоконник': {
      'длина': `${sillLengthMm} мм`,
      'ширина': `${sillWidthMm} мм`,
      'количество': 1,
    },
    'панели пластиковые': {
      'ширина панели': `${panelsWidthMm} мм`,
      'позиции': [
        { 'длина': `${panelVerticalLengthMm} мм`, 'количество': 2 },
        { 'длина': `${panelTopLengthMm} мм`, 'количество': 1 },
      ],
      'описание': `${panelVerticalLengthMm} мм - 2 шт, ${panelTopLengthMm} мм - 1 шт`,
      'итого длина': `${panelsTotalLengthMm} мм (${(panelsTotalLengthMm / 1000).toFixed(2)} м)`,
      'площадь': `${panelsAreaM2.toFixed(2)} м²`,
    },
    'стартовый профиль': {
      'позиции': starterProfilePositions.map(p => ({
        'длина': `${p.lengthMm} мм`,
        'количество': p.count,
      })),
      'описание': `${heightMm} мм - 2 шт, ${widthMm} мм - 1 шт`,
      'итого длина': `${starterTotalLengthMm} мм (${(starterTotalLengthMm / 1000).toFixed(2)} м)`,
    },
    'уголок завершающий': {
      'позиции': finishingCornerPositions.map(p => ({
        'длина': `${p.lengthMm} мм`,
        'количество': p.count,
      })),
      'описание': `${cornerVerticalLengthMm} мм - 2 шт, ${cornerTopLengthMm} мм - 1 шт`,
      'итого длина': `${cornerTotalLengthMm} мм (${(cornerTotalLengthMm / 1000).toFixed(2)} м)`,
    },
    'отлив': {
      'длина': `${dripLengthMm} мм`,
      'ширина': `${dripWidthMm} мм`,
      'количество': 1,
    },
    'монтажная пена': {
      'количество': 1,
    },
    meta: {
      sillAreaM2,
      panelsAreaM2Value: panelsAreaM2,
      starterTotalLengthM: starterTotalLengthMm / 1000,
      cornerTotalLengthM: cornerTotalLengthMm / 1000,
      dripAreaM2,
    },
  };
}

// ——— Интерфейс ———
document.addEventListener('DOMContentLoaded', () => {
  const windowWidthInput = document.getElementById('windowWidth');
  const windowHeightInput = document.getElementById('windowHeight');
  const openingDepthInput = document.getElementById('openingDepth');
  const unitSelect = document.getElementById('unitSelect');
  const calculateBtn = document.getElementById('calculateBtn');
  const calcCostBtn = document.getElementById('calcCostBtn');
  const resetBtn = document.getElementById('resetBtn');
  const resultViewEl = document.getElementById('resultView');
  const errorMessageEl = document.getElementById('errorMessage');

  function clearError() {
    errorMessageEl.textContent = '';
    errorMessageEl.classList.add('hidden');
  }

  function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.classList.remove('hidden');
  }

  function getInputValues(emptyMessage) {
    const windowWidth = parseFloat(windowWidthInput.value);
    const windowHeight = parseFloat(windowHeightInput.value);
    const openingDepth = parseFloat(openingDepthInput.value);
    const unit = unitSelect.value;
    if (!windowWidth || !windowHeight || !openingDepth) {
      return { ok: false, message: emptyMessage };
    }
    return { ok: true, windowWidth, windowHeight, openingDepth, unit };
  }

  function computeCosts(meta) {
    const sillCost = meta.sillAreaM2 * PRICES.sillPerM2;
    const panelsCost = meta.panelsAreaM2Value * PRICES.panelPerM2;
    const starterCost = meta.starterTotalLengthM * PRICES.starterPerM;
    const cornerCost = meta.cornerTotalLengthM * PRICES.cornerPerM;
    const dripCost = meta.dripAreaM2 * PRICES.dripPerM2;
    const totalCost = sillCost + panelsCost + starterCost + cornerCost + dripCost;
    return { sillCost, panelsCost, starterCost, cornerCost, dripCost, totalCost };
  }

  function buildCostBlockHTML(costs) {
    return `
      <div class="result-block-title">Стоимость материалов</div>
      <p class="result-line"><strong>Подоконник:</strong> ${costs.sillCost.toFixed(0)} ₽</p>
      <p class="result-line"><strong>Панели:</strong> ${costs.panelsCost.toFixed(0)} ₽</p>
      <p class="result-line"><strong>Стартовый профиль:</strong> ${costs.starterCost.toFixed(0)} ₽</p>
      <p class="result-line"><strong>Завершающий уголок:</strong> ${costs.cornerCost.toFixed(0)} ₽</p>
      <p class="result-line"><strong>Отлив:</strong> ${costs.dripCost.toFixed(0)} ₽</p>
      <p class="result-line"><strong>Итого:</strong> ${costs.totalCost.toFixed(0)} ₽</p>
    `;
  }

  function ensureCostBlock() {
    let block = document.getElementById('costBlock');
    if (!block) {
      block = document.createElement('div');
      block.id = 'costBlock';
      block.className = 'result-block';
      resultViewEl.appendChild(block);
    }
    return block;
  }

  function renderResult(result) {
    const sill = result['подоконник'];
    const panels = result['панели пластиковые'];
    const starter = result['стартовый профиль'];
    const corner = result['уголок завершающий'];
    const drip = result['отлив'];
    const foam = result['монтажная пена'];

    const panelsLines = panels['позиции']
      .map(p => `${p['длина']} - ${p['количество']} шт`)
      .join(', ');
    const starterLines = starter['позиции']
      .map(p => `${p['длина']} - ${p['количество']} шт`)
      .join(', ');
    const cornerLines = corner['позиции']
      .map(p => `${p['длина']} - ${p['количество']} шт`)
      .join(', ');

    resultViewEl.innerHTML = `
      <div class="result-block">
        <div class="result-block-title">Подоконник</div>
        <p class="result-line"><strong>Размер:</strong> ${sill['длина']} × ${sill['ширина']}</p>
        <p class="result-line"><strong>Количество:</strong> ${sill['количество']} шт</p>
      </div>
      <div class="result-block">
        <div class="result-block-title">Пластиковые панели (откосы)</div>
        <p class="result-line"><strong>Ширина панели:</strong> ${panels['ширина панели']}</p>
        <p class="result-line"><strong>Резы:</strong> ${panelsLines}</p>
        <p class="result-line"><strong>Итого длина:</strong> ${panels['итого длина']}</p>
        <p class="result-line"><strong>Итого площадь:</strong> ${panels['площадь']}</p>
      </div>
      <div class="result-block">
        <div class="result-block-title">Стартовый профиль</div>
        <p class="result-line"><strong>Резы:</strong> ${starterLines}</p>
        <p class="result-line"><strong>Итого резы:</strong> ${starter['описание']}</p>
        <p class="result-line"><strong>Итого длина:</strong> ${starter['итого длина']}</p>
      </div>
      <div class="result-block">
        <div class="result-block-title">Завершающий уголок</div>
        <p class="result-line"><strong>Резы:</strong> ${cornerLines}</p>
        <p class="result-line"><strong>Итого резы:</strong> ${corner['описание']}</p>
        <p class="result-line"><strong>Итого длина:</strong> ${corner['итого длина']}</p>
      </div>
      <div class="result-block">
        <div class="result-block-title">Отлив</div>
        <p class="result-line"><strong>Размер:</strong> ${drip['длина']} × ${drip['ширина']}</p>
        <p class="result-line"><strong>Количество:</strong> ${drip['количество']} шт</p>
      </div>
      <div class="result-block">
        <div class="result-block-title">Монтажная пена</div>
        <p class="result-line"><strong>Количество:</strong> ${foam['количество']} баллон</p>
      </div>
    `;
  }

  function handleCalculate() {
    clearError();
    const input = getInputValues('Заполните все размеры (они должны быть больше 0).');
    if (!input.ok) {
      showError(input.message);
      return;
    }
    try {
      const result = calculateMaterials({
        windowWidth: input.windowWidth,
        windowHeight: input.windowHeight,
        openingDepth: input.openingDepth,
        unit: input.unit,
      });
      renderResult(result);
      resetBtn.classList.add('active');
    } catch (e) {
      showError(e.message || 'Ошибка при расчёте.');
    }
  }

  function handleCalculateCost() {
    clearError();
    const input = getInputValues('Сначала заполните размеры для расчёта.');
    if (!input.ok) {
      showError(input.message);
      return;
    }
    try {
      const result = calculateMaterials({
        windowWidth: input.windowWidth,
        windowHeight: input.windowHeight,
        openingDepth: input.openingDepth,
        unit: input.unit,
      });
      renderResult(result);
      ensureCostBlock().innerHTML = buildCostBlockHTML(computeCosts(result.meta));
      resetBtn.classList.add('active');
    } catch (e) {
      showError(e.message || 'Ошибка при расчёте.');
    }
  }

  function handleReset() {
    windowWidthInput.value = '';
    windowHeightInput.value = '';
    openingDepthInput.value = '';
    unitSelect.value = 'mm';
    clearError();
    resultViewEl.textContent = 'Введите данные и нажмите «Рассчитать материалы»';
    resetBtn.classList.remove('active');
  }

  calculateBtn.addEventListener('click', handleCalculate);
  calcCostBtn.addEventListener('click', handleCalculateCost);
  resetBtn.addEventListener('click', handleReset);
});
