/**
 * 完整版邀请码门禁（防君子）
 * 规则 MN-Invite-v1，与 scripts/generate_invite_codes.py 一致
 */
(function (global) {
  var ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var PREFIX = 'MN';
  var BODY_LEN = 6;
  var SALT = 'mengnv-full-gate-v1';
  var STORAGE_KEY = 'mn_full_invite_v1';

  function normalize(code) {
    return String(code || '')
      .trim()
      .toUpperCase()
      .replace(/[-\s]/g, '');
  }

  function checksum(body) {
    var h = 2166136261;
    var data = body + SALT;
    for (var i = 0; i < data.length; i++) {
      h ^= data.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
      h = (h + (i * 131) + SALT.charCodeAt(i % SALT.length)) >>> 0;
    }
    return ALPHABET[h % 32] + ALPHABET[Math.floor(h / 32) % 32];
  }

  function isValidCode(code) {
    var c = normalize(code);
    if (c.length !== PREFIX.length + BODY_LEN + 2) return false;
    if (c.slice(0, PREFIX.length) !== PREFIX) return false;
    var body = c.slice(PREFIX.length, PREFIX.length + BODY_LEN);
    var check = c.slice(-2);
    for (var i = 0; i < body.length; i++) {
      if (ALPHABET.indexOf(body.charAt(i)) < 0) return false;
    }
    if (ALPHABET.indexOf(check.charAt(0)) < 0 || ALPHABET.indexOf(check.charAt(1)) < 0) {
      return false;
    }
    return check === checksum(body);
  }

  function isUnlocked() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      return !!(data && data.ok === 1 && data.v === 1);
    } catch (e) {
      return false;
    }
  }

  function unlock(code) {
    if (!isValidCode(code)) return false;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ok: 1, v: 1, at: Date.now() })
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  function homeUrl(query) {
    // 用当前地址解析绝对路径，file:// 与 http 都可用
    var q = query || '';
    if (q && q.charAt(0) !== '?') q = '?' + q;
    try {
      var url = new URL('../index.html', location.href);
      url.search = q ? q.slice(1) : '';
      return url.href;
    } catch (e) {
      return '../index.html' + q;
    }
  }

  /** 子页：未激活则隐藏并跳回首页 */
  function guardSubpage() {
    if (isUnlocked()) return true;
    try {
      document.documentElement.style.visibility = 'hidden';
    } catch (e) {}
    location.replace(homeUrl('needInvite=1'));
    return false;
  }

  global.MNGate = {
    isValidCode: isValidCode,
    isUnlocked: isUnlocked,
    unlock: unlock,
    guardSubpage: guardSubpage,
    homeUrl: homeUrl,
    STORAGE_KEY: STORAGE_KEY
  };
})(window);
