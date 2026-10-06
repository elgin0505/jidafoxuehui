"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface Member {
  id: string;
  memberId: string;
  name: string;
  email: string;
  photo: string | null;
  birthday?: string | null;
  role?: string;
  totalPoints: number;
}

interface MemberContextValue {
  members: Member[];
  currentMember: Member | null;
  setCurrentMemberId: (id: string) => void;
  refreshMembers: () => Promise<Member[]>;
  loading: boolean;
}

const MemberContext = createContext<MemberContextValue | null>(null);

export function MemberProvider({ children }: { children: ReactNode }) {
  // 缓存优先（Cache-First）：首帧尝试从 localStorage 恢复已缓存的会员列表与当前会员，实现 0ms 秒开无骨架屏跳闪
  const [members, setMembers] = useState<Member[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("jbs_cached_members");
      const list: Member[] = cached ? JSON.parse(cached) : [];
      const authUserStr = localStorage.getItem("jbs_auth_user");
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        const targetId = authUser.memberId || authUser.id;
        if (targetId && !list.some((m) => m.id === targetId)) {
          list.unshift({
            id: targetId,
            memberId: authUser.memberCode || "FXH0001",
            name: authUser.name || "同修",
            email: authUser.email || "",
            photo: null,
            role: authUser.role || "学员",
            totalPoints: 0,
          });
        }
      }
      return list;
    } catch {
      return [];
    }
  });

  const [currentMemberId, setCurrentMemberIdState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem("currentMemberId");
      if (saved) return saved;
      const authUserStr = localStorage.getItem("jbs_auth_user");
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        return authUser.memberId || authUser.id || "";
      }
      return "";
    } catch {
      return "";
    }
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const savedId = localStorage.getItem("currentMemberId");
      const cached = localStorage.getItem("jbs_cached_members");
      const authUserStr = localStorage.getItem("jbs_auth_user");
      // 如果本地已有会员缓存或当前已登录会员，首屏直接就绪，无需干等网络返回骨架屏
      return !(savedId || cached || authUserStr);
    } catch {
      return true;
    }
  });

  const refreshMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (Array.isArray(data)) {
        setMembers(data);
        try {
          localStorage.setItem("jbs_cached_members", JSON.stringify(data));
        } catch {}
        return data as Member[];
      }
      return [];
    } catch (err) {
      console.error("Failed to refresh members:", err);
      return [];
    }
  };

  useEffect(() => {
    refreshMembers()
      .then((data) => {
        const saved = localStorage.getItem("currentMemberId");
        if (saved && data.find((m: Member) => m.id === saved)) {
          setCurrentMemberIdState(saved);
        } else if (data.length > 0 && !currentMemberId) {
          setCurrentMemberIdState(data[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to initialize members:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const setCurrentMemberId = (id: string) => {
    setCurrentMemberIdState(id);
    localStorage.setItem("currentMemberId", id);
  };

  const currentMember =
    members.find((m) => m.id === currentMemberId) ?? (members.length > 0 ? members[0] : null);

  return (
    <MemberContext.Provider
      value={{
        members,
        currentMember,
        setCurrentMemberId,
        refreshMembers,
        loading,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used within MemberProvider");
  return ctx;
}

export function MemberSelector() {
  const { members, currentMember, setCurrentMemberId, loading } = useMember();

  if (loading) {
    return (
      <div className="h-10 w-48 animate-pulse rounded-xl bg-ocher-light/30" />
    );
  }

  return (
    <select
      value={currentMember?.id ?? ""}
      onChange={(e) => setCurrentMemberId(e.target.value)}
      className="rounded-xl border border-ocher/30 bg-white/80 px-4 py-2.5 text-sm font-medium text-charcoal shadow-sm transition-all focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20"
    >
      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name} ({member.memberId})
        </option>
      ))}
    </select>
  );
}
