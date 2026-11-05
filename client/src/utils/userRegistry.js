const REGISTRY_KEY = "learnymo_users_registry";
const OVERRIDES_KEY = "learnymo_user_overrides";

export const getUsersRegistry = () => {
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) || "{}");
  } catch {
    return {};
  }
};

export const getUserOverrides = () => {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}");
  } catch {
    return {};
  }
};

export const saveUserOverride = (userId, updates) => {
  if (!userId) return;
  const overrides = getUserOverrides();
  const prev = overrides[userId] || {};
  overrides[userId] = {
    ...prev,
    ...updates,
    permissions: updates.permissions
      ? { ...(prev.permissions || {}), ...updates.permissions }
      : prev.permissions,
  };
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));

  // Also reflect in registry if user exists there
  const reg = getUsersRegistry();
  if (reg[userId]) {
    reg[userId] = applyOverridesToUser(reg[userId], overrides[userId]);
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
  }
};

export const applyOverridesToUser = (userObj, override) => {
  if (!userObj) return userObj;
  const ov = override || getUserOverrides()[userObj._id];
  if (!ov) return userObj;

  return {
    ...userObj,
    accountStatus: ov.accountStatus || userObj.accountStatus || "active",
    permissions: {
      canCreateClasses: true,
      canBookClasses: true,
      canChat: true,
      ...(userObj.permissions || {}),
      ...(ov.permissions || {}),
    },
    teacherProfile:
      userObj.role === "teacher" || userObj.teacherProfile
        ? {
            ...(userObj.teacherProfile || {}),
            verificationStatus:
              ov.verificationStatus ||
              userObj.teacherProfile?.verificationStatus ||
              userObj.verificationStatus ||
              "pending",
          }
        : userObj.teacherProfile,
  };
};

export const mergeUserRecords = (existing = {}, incoming = {}) => {
  const merged = {
    ...existing,
    ...incoming,
    name: incoming.name || existing.name,
    email: incoming.email || existing.email,
    phone: incoming.phone || existing.phone,
    role: incoming.role || existing.role,
    walletBalance:
      incoming.walletBalance !== undefined
        ? incoming.walletBalance
        : existing.walletBalance,
    accountStatus:
      incoming.accountStatus || existing.accountStatus || "active",
    permissions: {
      canCreateClasses: true,
      canBookClasses: true,
      canChat: true,
      ...(existing.permissions || {}),
      ...(incoming.permissions || {}),
    },
  };

  if (existing.teacherProfile || incoming.teacherProfile || merged.role === "teacher") {
    const etp = existing.teacherProfile || {};
    const itp = incoming.teacherProfile || {};
    merged.teacherProfile = {
      ...etp,
      ...itp,
      headline: itp.headline !== undefined ? itp.headline : etp.headline,
      bio: itp.bio !== undefined ? itp.bio : etp.bio,
      hourlyRate:
        itp.hourlyRate !== undefined ? itp.hourlyRate : etp.hourlyRate,
      experienceYears:
        itp.experienceYears !== undefined
          ? itp.experienceYears
          : etp.experienceYears,
      qualifications:
        itp.qualifications?.length > 0
          ? itp.qualifications
          : etp.qualifications || [],
      subjects:
        itp.subjects?.length > 0 ? itp.subjects : etp.subjects || [],
      verificationDocuments:
        itp.verificationDocuments?.length > 0
          ? itp.verificationDocuments
          : etp.verificationDocuments || [],
      verificationStatus:
        itp.verificationStatus ||
        incoming.verificationStatus ||
        etp.verificationStatus ||
        existing.verificationStatus ||
        "pending",
      rating: itp.rating || etp.rating || 5.0,
      ratingCount: itp.ratingCount || etp.ratingCount || 1,
    };
  }

  if (existing.studentProfile || incoming.studentProfile || merged.role === "student") {
    const esp = existing.studentProfile || {};
    const isp = incoming.studentProfile || {};
    merged.studentProfile = {
      ...esp,
      ...isp,
      studentId: isp.studentId || esp.studentId || "LMO-10294",
      grade: isp.grade || esp.grade || "A/L",
      stream: isp.stream || esp.stream || "Physical Science",
      medium: isp.medium || esp.medium || "English",
      school: isp.school !== undefined ? isp.school : esp.school || "",
      topicProgress:
        isp.topicProgress?.length > 0
          ? isp.topicProgress
          : esp.topicProgress || [],
      studyPlans:
        isp.studyPlans?.length > 0 ? isp.studyPlans : esp.studyPlans || [],
    };
  }

  return applyOverridesToUser(merged);
};

export const syncUserToRegistry = (userObj) => {
  if (!userObj || !userObj._id) return;
  const reg = getUsersRegistry();
  const cleanUser = { ...userObj };
  delete cleanUser.token;
  reg[userObj._id] = mergeUserRecords(reg[userObj._id] || {}, cleanUser);
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
};

export const syncUsersListToRegistry = (usersList = []) => {
  if (!Array.isArray(usersList) || usersList.length === 0) return;
  const reg = getUsersRegistry();
  usersList.forEach((u) => {
    if (u && u._id) {
      const cleanUser = { ...u };
      delete cleanUser.token;
      reg[u._id] = mergeUserRecords(reg[u._id] || {}, cleanUser);
    }
  });
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
};

