/**
 * Google Apps Script для приёма заявок с лендинга "Кофе и точка"
 * в Google Таблицу.
 *
 * Как использовать:
 * 1) Создайте Google Таблицу (https://sheets.google.com) и откройте её.
 * 2) Расширения → Apps Script.
 * 3) Замените содержимое редактора на этот код и сохраните.
 * 4) Нажмите "Начать развёртывание" → "Новое развёртывание".
 * 5) Тип: "Веб-приложение".
 *    - Описание: Форма заявок
 *    - Запускать от имени: Я
 *    - У кого есть доступ: Все
 * 6) Разрешите доступ к таблице (Google попросит подтверждение).
 * 7) Скопируйте URL веб-приложения (оканчивается на /exec).
 * 8) Вставьте этот URL в simple-landing/script.js в константу FORM_ENDPOINT.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = parsePayload_(e);
    ensureHeader_(sheet);

    sheet.appendRow([
      new Date(),
      data.name || "",
      data.phone || "",
      data.time || "",
      data.message || "",
      data.page || "",
      data.submittedAt || ""
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, message: "Lead endpoint is running" });
}

function parsePayload_(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    var contents = e.postData.contents;
    var type = (e.postData.type || "").toLowerCase();

    // JSON (в т.ч. отправленный как text/plain, чтобы избежать CORS preflight)
    if (type.indexOf("application/json") !== -1 || type.indexOf("text/plain") !== -1 || contents.charAt(0) === "{") {
      try { return JSON.parse(contents) || {}; } catch (_) {}
    }

    // application/x-www-form-urlencoded в теле
    if (type.indexOf("application/x-www-form-urlencoded") !== -1) {
      try {
        var params = contents.split("&");
        var obj = {};
        params.forEach(function (pair) {
          if (!pair) return;
          var idx = pair.indexOf("=");
          var k = idx >= 0 ? pair.slice(0, idx) : pair;
          var v = idx >= 0 ? pair.slice(idx + 1) : "";
          obj[decodeURIComponent(k.replace(/\+/g, " "))] = decodeURIComponent(v.replace(/\+/g, " "));
        });
        return obj;
      } catch (_) {}
    }
  }
  // Поддержка form-encoded отправки через e.parameter
  return (e && e.parameter) ? e.parameter : {};
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow(["Дата получения", "Имя", "Телефон", "Удобное время", "Комментарий", "Страница", "Время отправки (клиент)"]);
  sheet.setFrozenRows(1);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
