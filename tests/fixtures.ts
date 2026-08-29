import { Presenter } from "../src/Presenter";

export interface User {
  id: string;
  email: string;
  active: boolean;
  firstName: string;
  lastName: string;
  createdAt: string;
  status: "active" | "suspended";
}

export interface UserContext {
  locale?: string;
  currentUserId?: string;
  currentUser?: { can(permission: string): boolean };
}

export class UserPresenter extends Presenter<User, UserContext> {
  get fullName() {
    return `${this.data.firstName} ${this.data.lastName}`;
  }

  get canEdit() {
    return this.context.currentUserId === this.data.id;
  }

  get showEmail() {
    return this.context.currentUser?.can("users.read_email") === true;
  }

  get email() {
    if (!this.showEmail) {
      throw new Error("not authorized");
    }
    return this.data.email;
  }

  get statusLabel() {
    return this.t(`users.status.${this.data.status}`);
  }

  get formattedCreatedAt() {
    return this.format.date(this.data.createdAt, { dateStyle: "medium" });
  }

  async profileScore(): Promise<number> {
    await Promise.resolve();
    return this.data.active ? 100 : 0;
  }
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "1",
    email: "a@example.com",
    active: true,
    firstName: "Ada",
    lastName: "Lovelace",
    createdAt: "2024-01-01T00:00:00.000Z",
    status: "active",
    ...overrides,
  };
}
