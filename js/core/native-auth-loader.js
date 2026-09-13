/*=========================================================
  RGMS NATIVE FIREBASE AUTH BRIDGE
  Android WebView wrapper + native Firebase Phone OTP
=========================================================*/
(function () {
  "use strict";
  window.RGMS = window.RGMS || {};

  const raw = window.RGMSNativeAuth || null;
  const available = !!(raw && typeof raw.isAvailable === "function" && raw.isAvailable() === true);
  window.RGMS.isNativeAndroid = available;

  const bridge = available ? {
    sendOtp: (...args) => raw.sendOtp(...args),
    verifyOtp: (...args) => raw.verifyOtp(...args),
    signInStaff: (...args) => raw.signInStaff(...args),
    resetOfficerPassword: (...args) => typeof raw.resetOfficerPassword === "function" ? raw.resetOfficerPassword(...args) : false,
    signOut: (...args) => raw.signOut(...args),
    isAvailable: () => true,
    openExternal: (url) => typeof raw.openExternal === "function" ? raw.openExternal(url) : false,
    openPaymentApp: (app) => typeof raw.openPaymentApp === "function" ? raw.openPaymentApp(app) : false,
    openP2PPaymentApp: (app, recipient) => typeof raw.openP2PPaymentApp === "function" ? raw.openP2PPaymentApp(app, recipient) : false,
    openUpiChooser: (uri) => typeof raw.openUpiChooser === "function" ? raw.openUpiChooser(uri) : false,
    openUpiApp: (app, uri) => typeof raw.openUpiApp === "function" ? raw.openUpiApp(app, uri) : false,
    getAndroidPackageName: () => typeof raw.getAndroidPackageName === "function" ? raw.getAndroidPackageName() : "",
    getSigningSha1: () => typeof raw.getSigningSha1 === "function" ? raw.getSigningSha1() : "",
    getSigningSha256: () => typeof raw.getSigningSha256 === "function" ? raw.getSigningSha256() : "",
    getFirebaseAppId: () => typeof raw.getFirebaseAppId === "function" ? raw.getFirebaseAppId() : "",
    getFirebaseProjectId: () => typeof raw.getFirebaseProjectId === "function" ? raw.getFirebaseProjectId() : "",
    requestLocationPermission: () => typeof raw.requestLocationPermission === "function" ? raw.requestLocationPermission() : false,
    getCurrentUser: () => {
      try {
        const value = typeof raw.getCurrentUser === "function" ? raw.getCurrentUser() : (typeof raw.currentUserJson === "function" ? raw.currentUserJson() : "");
        if (!value) return null;
        const user = typeof value === "string" ? JSON.parse(value) : value;
        return user && user.uid ? { user } : null;
      } catch (_) { return null; }
    }
  } : null;

  // Fix the quote typo defensively if this file is copied/edited in a text editor.
  if (bridge && typeof bridge.getCurrentUser !== "function") bridge.getCurrentUser = () => null;

  window.RGMS.nativeFirebaseAuthReady = Promise.resolve(bridge);
  window.RGMS.getNativeFirebaseAuth = async function () { return bridge; };
  window.RGMS.openExternal = function (url) {
    if (bridge?.openExternal?.(url)) return true;
    try { window.open(url, "_blank", "noopener,noreferrer"); return true; } catch (_) { return false; }
  };
  window.RGMS.openPaymentApp = function (app) {
    return !!bridge?.openPaymentApp?.(app);
  };
  window.RGMS.openP2PPaymentApp = function (app, recipient) {
    return !!bridge?.openP2PPaymentApp?.(app, recipient);
  };
  window.RGMS.openUpiChooser = function (uri) {
    if (bridge?.openUpiChooser?.(uri)) return true;
    try { window.location.href = uri; return true; } catch (_) { return false; }
  };
  window.RGMS.openUpiApp = function (app, uri) {
    if (bridge?.openUpiApp?.(app, uri)) return true;
    try { window.location.href = uri; return true; } catch (_) { return false; }
  };
})();