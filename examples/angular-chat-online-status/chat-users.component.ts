import { Component, HostListener, OnDestroy, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Subject, takeUntil } from "rxjs";
import { ChatSocketService } from "./chat-socket.service";

interface ChatUser {
    _id: string;
    id?: string;
    username: string;
    email: string;
    isOnline?: boolean;
    lastSeen?: string | Date | null;
}

@Component({
    selector: "app-chat-users",
    templateUrl: "./chat-users.component.html",
    styleUrls: ["./chat-users.component.css"]
})
export class ChatUsersComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly apiUrl = "http://localhost:3000";

    users: ChatUser[] = [];

    constructor(
        private readonly http: HttpClient,
        private readonly chatSocket: ChatSocketService
    ) {}

    ngOnInit(): void {
        const token = localStorage.getItem("token");

        if (token) {
            this.chatSocket.connect(token, this.apiUrl);
        }

        this.loadUsers();
        this.chatSocket.onlineUsers$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.updateUserStatus());
    }

    loadUsers(): void {
        this.http
            .get<{ data: ChatUser[] }>(`${this.apiUrl}/api/auth/adminuser`)
            .pipe(takeUntil(this.destroy$))
            .subscribe((response) => {
                this.users = response.data || [];
                this.updateUserStatus();
            });
    }

    isOnline(user: ChatUser): boolean {
        return this.chatSocket.isOnline(user._id) || Boolean(user.id && this.chatSocket.isOnline(user.id));
    }

    lastSeenText(user: ChatUser): string {
        if (this.isOnline(user)) {
            return "Online";
        }

        return user.lastSeen ? `Last seen ${new Date(user.lastSeen).toLocaleString()}` : "Offline";
    }

    logout(): void {
        this.chatSocket.disconnect();
        localStorage.removeItem("token");
    }

    trackByUserId(_: number, user: ChatUser): string {
        return user._id;
    }

    @HostListener("window:beforeunload")
    handleBeforeUnload(): void {
        this.chatSocket.disconnect();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private updateUserStatus(): void {
        this.users = this.users.map((user) => ({
            ...user,
            isOnline: this.isOnline(user)
        }));
    }
}
