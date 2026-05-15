import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { io, Socket } from "socket.io-client";

export interface OnlineUser {
    userId: string; // MongoDB _id
    id?: string; // Custom user id, if your UI uses it
    username?: string;
    email?: string;
    isOnline: boolean;
    lastSeen?: string | Date | null;
}

export interface OnlineUsersPayload {
    onlineUserIds: string[];
    users: OnlineUser[];
    changedUser: OnlineUser | null;
}

@Injectable({ providedIn: "root" })
export class ChatSocketService implements OnDestroy {
    private socket?: Socket;
    private readonly onlineUsersSubject = new BehaviorSubject<Map<string, OnlineUser>>(new Map());

    readonly onlineUsers$ = this.onlineUsersSubject.asObservable();

    connect(token: string, socketUrl = "http://localhost:3000"): void {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(socketUrl, {
            transports: ["websocket"],
            withCredentials: true,
            auth: { token }
        });

        this.socket.on("connect", () => {
            this.socket?.emit("get_online_users", (payload: OnlineUsersPayload) => {
                this.applyOnlineUsers(payload);
            });
        });

        this.socket.on("online_users_update", (payload: OnlineUsersPayload) => {
            this.applyOnlineUsers(payload);
        });
    }

    markOnline(userId?: string): void {
        this.socket?.emit("user_online", userId ? { userId } : {});
    }

    disconnect(): void {
        if (!this.socket) {
            return;
        }

        // Emit explicit logout/offline; disconnect also covers tab close/network drops.
        this.socket.emit("user_offline");
        this.socket.disconnect();
        this.socket = undefined;
    }

    isOnline(userId: string): boolean {
        return this.onlineUsersSubject.value.has(userId);
    }

    private applyOnlineUsers(payload: OnlineUsersPayload): void {
        const users = new Map<string, OnlineUser>();

        for (const user of payload.users || []) {
            users.set(user.userId, { ...user, isOnline: true });
            if (user.id) {
                users.set(user.id, { ...user, isOnline: true });
            }
        }

        this.onlineUsersSubject.next(users);
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
