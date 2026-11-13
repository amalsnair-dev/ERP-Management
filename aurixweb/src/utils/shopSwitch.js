import { axiosInstanceNoHeader } from "../services/axiosConfig";
import { existsByUsername } from "../services/ShopAPI";
import {
  clearAuthSession,
  getCurrentUser,
  getFrameForPath,
  getOriginalLoginFrames,
  getOriginalLoginUsername,
  normalizeFrames,
  setCurrentModule,
  setCurrentShopCode,
  updateCurrentUser,
} from "./session";

const redirectToSignin = ({ currentModule, navigate, normalizedShopCode, message }) => {
  sessionStorage.setItem("pendingShopSwitch", "true");
  sessionStorage.setItem("pendingShopCode", normalizedShopCode);
  if (currentModule) {
    setCurrentModule(currentModule);
    sessionStorage.setItem("pendingReturnPath", currentModule);
  }
  if (message) {
    sessionStorage.setItem("pendingSigninMessage", String(message));
  }
  clearAuthSession({ preserveCurrentModule: true });
  navigate("/signin", { replace: true });
};

export const handleShopSwitch = async ({
  nextShopCode,
  username,
  currentModule,
  navigate,
  onSuccess,
}) => {
  const normalizedShopCode = String(nextShopCode || "").trim().toUpperCase();
  const normalizedUsername = String(username || "").trim().toUpperCase();
  const currentUser = getCurrentUser() || {};
  const normalizedPassword = String(currentUser.password || "").trim();
  const currentShopCode = String(currentUser.shopcode || "").trim().toUpperCase();
  const requiredFrame = getFrameForPath(currentModule);
  const originalLoginUsername = String(
    getOriginalLoginUsername() || currentUser.username || normalizedUsername
  ).trim().toUpperCase();
  const storedOriginalFrames = normalizeFrames(getOriginalLoginFrames());
  let baselineFrames = storedOriginalFrames.length > 0
    ? storedOriginalFrames
    : normalizeFrames(currentUser.frames);
  const debugLog = (stage, extra = {}) => {
    console.log("[shopSwitch]", stage, {
      currentModule,
      normalizedShopCode,
      normalizedUsername,
      currentShopCode,
      requiredFrame,
      originalLoginUsername,
      baselineFrames,
      ...extra,
    });
  };
  if (!normalizedShopCode) {
    return { ok: false, requiresSignin: false, message: "Please select a shop code." };
  }

  if (!normalizedUsername || !normalizedPassword) {
    redirectToSignin({ currentModule, navigate, normalizedShopCode });
    return { ok: false, requiresSignin: true };
  }

  debugLog("start");

  const exists = await existsByUsername(originalLoginUsername, normalizedShopCode);

  if (!exists) {
    redirectToSignin({
      currentModule,
      navigate,
      normalizedShopCode,
      message: `Username ${originalLoginUsername} is not available in shop ${normalizedShopCode}. Please sign in again.`,
    });
    return { ok: false, requiresSignin: true };
  }

  try {
    if (currentShopCode && currentShopCode !== normalizedShopCode) {
      const currentShopResponse = await axiosInstanceNoHeader.post(
        "/user/login",
        {
          username: originalLoginUsername,
          password: normalizedPassword,
        },
        {
          params: { shopcode: currentShopCode },
        }
      );

      const currentShopUsername = String(currentShopResponse.data?.username || "").trim().toUpperCase();
      const currentShopFrames = normalizeFrames(currentShopResponse.data?.frames);

      if (currentShopUsername === originalLoginUsername && currentShopFrames.length > 0) {
        baselineFrames = currentShopFrames;
      }

      debugLog("baseline_loaded", {
        currentShopUsername,
        currentShopFrames,
      });
    }

    const response = await axiosInstanceNoHeader.post(
      "/user/login",
      {
        username: originalLoginUsername,
        password: normalizedPassword,
      },
      {
        params: { shopcode: normalizedShopCode },
      }
    );

    const responseUsername = String(response.data?.username || "").trim().toUpperCase();
    const nextFrames = normalizeFrames(response.data?.frames);

    debugLog("target_loaded", {
      responseUsername,
      nextFrames,
    });

    if (responseUsername && responseUsername !== originalLoginUsername) {
      debugLog("deny_username_mismatch", { responseUsername });
      redirectToSignin({
        currentModule,
        navigate,
        normalizedShopCode,
        message: `Logged in user ${originalLoginUsername} is not allowed to access ${requiredFrame || "this frame"} in ${normalizedShopCode}. Please sign in again.`,
      });
      return { ok: false, requiresSignin: true };
    }

    if (requiredFrame && !nextFrames.includes(requiredFrame)) {
      debugLog("deny_current_frame_missing", { responseUsername, nextFrames });
      redirectToSignin({
        currentModule,
        navigate,
        normalizedShopCode,
        message: `Logged in user ${originalLoginUsername} is not allowed to access ${requiredFrame} in ${normalizedShopCode}. Please sign in again.`,
      });
      return { ok: false, requiresSignin: true };
    }

    const missingFrame = baselineFrames.find((frame) => !nextFrames.includes(frame));
    if (missingFrame) {
      debugLog("deny_missing_original_frame", { missingFrame, nextFrames });
      redirectToSignin({
        currentModule,
        navigate,
        normalizedShopCode,
        message: `Logged in user ${originalLoginUsername} is not allowed to access ${missingFrame} in ${normalizedShopCode}. Please sign in again.`,
      });
      return { ok: false, requiresSignin: true };
    }

    debugLog("allow_switch", { responseUsername, nextFrames });
    const targetUserId =
      response.data?.id ??
      response.data?.userid ??
      response.data?.user_id ??
      response.data?.userId ??
      currentUser.id ??
      currentUser.userid ??
      currentUser.user_id ??
      null;

    updateCurrentUser({
      ...response.data,
      id: targetUserId,
      userid: targetUserId,
      user_id: targetUserId,
      username: response.data?.username || normalizedUsername,
      shopcode: normalizedShopCode,
      roles: response.data?.roles ?? currentUser.roles,
      frames: nextFrames,
    });

    if (typeof onSuccess === "function") {
      onSuccess(normalizedShopCode);
    }

    return { ok: true, requiresSignin: false };
  } catch (error) {
    redirectToSignin({
      currentModule,
      navigate,
      normalizedShopCode,
      message:
        error.response?.data?.message ||
        error.response?.data ||
        `Unable to verify access for shop ${normalizedShopCode}. Please sign in again.`,
    });
    return { ok: false, requiresSignin: true };
  }
};












