const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyPhyYaZhVCE3LyP7wfK_O3t3pACmjKHo53kET2F2K6YMf6DgyNWxcMxHGFVyIGkp7Nug/exec";

let currentData = null;
let selectedDayIndex = 0;

const WEEK_DAYS = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)'];
const WEEK_KEYS = ['日', '一', '二', '三', '四', '五', '六'];
