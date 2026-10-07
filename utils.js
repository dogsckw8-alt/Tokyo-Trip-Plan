// 清理景點名稱（去掉 | 之後的說明）
function getCleanSpotName(rawName) {
  if (!rawName) return '';
  return rawName.split('|')[0].trim();
}

function parseDurationMins(durationVal) {
  if (!durationVal) return 60;
  const str = String(durationVal).trim();
  if (!str) return 60;
  
  if (str.includes('h') || str.includes('時')) {
    const num = parseFloat(str);
    return isNaN(num) ? 60 : Math.round(num * 60);
  }
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : 60;
}

function getBetweenSpotsTransport(fromSpot, toSpot) {
  if (!currentData || !currentData.transports || !fromSpot || !toSpot) return null;
  
  const cleanFrom = getCleanSpotName(fromSpot);
  const cleanTo = getCleanSpotName(toSpot);
  const tMap = currentData.transports;

  if (tMap[`${cleanFrom}➔${cleanTo}`]) return tMap[`${cleanFrom}➔${cleanTo}`];
  if (tMap[`${cleanFrom}→${cleanTo}`]) return tMap[`${cleanFrom}→${cleanTo}`];

  for (const key in tMap) {
    const item = tMap[key];
    if (item && item.From && item.To) {
      if (item.From.trim() === cleanFrom && item.To.trim() === cleanTo) {
        return item;
      }
    }
  }
  return null;
}

function calcDepartureTime(startTimeStr, durationMins) {
  if (!startTimeStr || !startTimeStr.includes(':')) return null;
  const [h, m] = startTimeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  
  const totalMins = h * 60 + m + durationMins;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  
  const pad = n => String(n).padStart(2, '0');
  return `${pad(endH)}:${pad(endM)}`;
}

function formatMins(rawVal) {
  if (!rawVal && rawVal !== 0) return '移動中';
  const str = String(rawVal).trim();
  if (!str) return '移動中';
  if (str.toLowerCase().includes('min')) return str;
  return `${str} mins`;
}

function formatFeeDisplay(rawFee) {
  if (!rawFee && rawFee !== 0) return '';
  const str = String(rawFee).trim();
  if (str === '0' || str.toLowerCase().includes('pass') || str.includes('免')) {
    return '<span class="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded-lg text-sm font-bold">🎫 Pass涵蓋 (¥0)</span>';
  }
  const numMatch = str.match(/\d+/);
  const val = numMatch ? numMatch[0] : str;
  return `<span class="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg text-sm font-bold">💰 交通票/IC卡 ¥${val}</span>`;
}

function formatHoursDisplay(hoursStr) {
  if (!hoursStr) return '請參考官方說明';
  const str = String(hoursStr).trim();
  if (!str) return '請參考官方說明';
  return str.replace(/(\d{1,2}:\d{2}\s*[-~～]\s*\d{1,2}:\d{2})[\s,;/]+(\d{1,2}:\d{2}\s*[-~～]\s*\d{1,2}:\d{2})/g, '$1\n$2');
}

function parseSubSpots(subSpotsStr) {
  if (!subSpotsStr) return [];
  return String(subSpotsStr)
    .split(/[,，、\n]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function calcMultiLegTime(routeParts) {
  let total = 0;
  let legTimes = [];
  let hasValid = false;

  for (let i = 0; i < routeParts.length - 1; i++) {
    const from = routeParts[i];
    const to = routeParts[i + 1];
    const info = findTransportInfo(`${from}➔${to}`, [from, to]);
    const num = parseInt(info.Time || info.Duration || 0, 10);
    if (!isNaN(num) && num > 0) {
      total += num;
      legTimes.push(num);
      hasValid = true;
    }
  }

  if (hasValid && routeParts.length > 2) {
    return `${total} mins (${legTimes.join('+')})`;
  } else if (hasValid) {
    return `${total} mins`;
  }
  return null;
}

function calcMultiLegFee(routeParts) {
  let totalFee = 0;
  let hasValidFee = false;

  for (let i = 0; i < routeParts.length - 1; i++) {
    const from = routeParts[i];
    const to = routeParts[i + 1];
    const info = findTransportInfo(`${from}➔${to}`, [from, to]);
    
    if (info && info.Fee !== undefined && info.Fee !== null && String(info.Fee).trim() !== '') {
      const feeStr = String(info.Fee).trim();
      const numMatch = feeStr.match(/\d+/);
      if (numMatch) {
        totalFee += parseInt(numMatch[0], 10);
        hasValidFee = true;
      }
    }
  }

  return hasValidFee ? totalFee : null;
}

function timeToMins(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function getBestOpenTime(dbHoursStr, referenceTime) {
  if (!dbHoursStr) return null;
  const matches = [...dbHoursStr.matchAll(/(\d{1,2}:\d{2})\s*-[^, ]+/g)].map(m => m[1]);
  
  if (matches.length === 0) {
    const simple = dbHoursStr.match(/(\d{1,2}:\d{2})/);
    return simple ? simple[1] : null;
  }
  
  if (matches.length === 1 || !referenceTime) return matches[0];

  const refMins = timeToMins(referenceTime);
  if (refMins === null) return matches[0];

  let closestTime = matches[0];
  let minDiff = Infinity;

  matches.forEach(t => {
    const tMins = timeToMins(t);
    if (tMins !== null) {
      const diff = Math.abs(tMins - refMins);
      if (diff < minDiff) {
        minDiff = diff;
        closestTime = t;
      }
    }
  });

  return closestTime;
}

function parseCellContent(rawString) {
  if (!rawString) return { spotName: '', subTitle: '', notice: '', openTime: null, queueTime: null, leaveTime: null };

  const parts = rawString.split('|').map(s => s.trim());
  const spotName = parts[0] || '';
  const subTitle = parts[1] || '';
  const notice = parts.slice(2).join(' ') || '';

  const openMatch = notice.match(/(\d{1,2}:\d{2})\s*(?:營業|開店|開門)|(?:營業|開店|開門)\s*(\d{1,2}:\d{2})/);
  const openTime = openMatch ? (openMatch[1] || openMatch[2]) : null;

  const leaveMatch = notice.match(/(\d{1,2}:\d{2})\s*(?:前)?(?:必須)?離開|(?:前|必須)?離開\s*(\d{1,2}:\d{2})/);
  const leaveTime = leaveMatch ? (leaveMatch[1] || leaveMatch[2]) : null;

  const queueMatch = notice.match(/(\d{1,2}:\d{2})\s*(?:排隊|抵達|集合)|(?:排隊|抵達|集合|建議)\s*(\d{1,2}:\d{2})/);
  let queueTime = queueMatch ? (queueMatch[1] || queueMatch[2]) : null;

  if (!queueTime && !openTime && !leaveTime) {
    const simpleTimeMatch = notice.match(/(\d{1,2}:\d{2})/);
    if (simpleTimeMatch) queueTime = simpleTimeMatch[1];
  }

  return { spotName, subTitle, notice, openTime, queueTime, leaveTime };
}

function findTransportInfo(fullRoute, routeParts) {
  if (!currentData || !currentData.transports) return {};
  const tMap = currentData.transports;

  if (tMap[fullRoute]) return tMap[fullRoute];

  const from = routeParts[0] ? routeParts[0].trim() : '';
  const to = routeParts[routeParts.length - 1] ? routeParts[routeParts.length - 1].trim() : '';

  if (tMap[`${from}➔${to}`]) return tMap[`${from}➔${to}`];
  if (tMap[`${from}→${to}`]) return tMap[`${from}→${to}`];

  for (const key in tMap) {
    const item = tMap[key];
    if (item && item.From && item.To) {
      if (item.From.trim() === from && item.To.trim() === to) {
        return item;
      }
    }
  }
  return {};
}

function parseTitles(rawName, dbItem) {
  let main = rawName;
  let sub = dbItem.Name || '';

  if (rawName.includes('(') || rawName.includes('（')) {
    main = rawName;
  } else if (dbItem.RestType || dbItem['Rest.Type']) {
    const type = dbItem.RestType || dbItem['Rest.Type'];
    if (type && !rawName.includes(type)) sub = `${type} · ${sub}`;
  }

  if (main === sub) sub = '';
  return { mainTitle: main, subTitle: sub };
}

function getItemIcon(type, name) {
  if (!type) {
    if (name.includes('機場')) return '✈️';
    if (name.includes('酒店') || name.includes('飯店') || name.includes('HOTEL') || name.includes('Guesthouse')) return '🏨';
    return '📍';
  }
  if (type.includes('Hotel') || type.includes('飯店') || type.includes('住宿')) return '🏨';
  if (type.includes('餐廳') || type.includes('燒肉') || type.includes('壽司')) return '🍴';
  if (type.includes('面包') || type.includes('甜點') || type.includes('咖啡')) return '☕';
  if (type.includes('Spot') || type.includes('景點') || type.includes('神社') || type.includes('商店街')) return '⛩️';
  if (type.includes('Mall') || type.includes('購物') || type.includes('outlet')) return '🛍';
  return '📍';
}

function getReservationBadge(status) {
  if (!status) return '';
  if (status.includes('排隊') || status.includes('現場')) {
    return `<span class="bg-rose-950/80 border border-rose-800 text-rose-300 text-sm font-bold px-2.5 py-1 rounded-lg">🔴 現場排隊</span>`;
  }
  if (status.includes('預約') || status.includes('不用排')) {
    return `<span class="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm font-bold px-2.5 py-1 rounded-lg">🟢 已預約/不用排</span>`;
  }
  return `<span class="bg-amber-950/80 border border-amber-800 text-amber-300 text-sm font-bold px-2.5 py-1 rounded-lg">🟡 ${status}</span>`;
}
