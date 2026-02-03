import type { Maybe } from "@/types";
import type { BaseEvent } from "@/types/event";
import type { ILoginResult } from "@/types/user";
import { nanoid } from "nanoid";

export class UserLoginEvent implements BaseEvent {
  $event_id: string;
  $event_name: string = UserLoginEvent.name;
  id: string;
  openid?: Maybe<string>;
  phone?: Maybe<string>;
  username?: Maybe<string>;
  token: string;
  roles: string[];
  permissions: string[];

  constructor(loginResult: ILoginResult) {
    this.$event_id = nanoid(8) + nanoid(4);
    this.id = loginResult.id;
    this.openid = loginResult.openid;
    this.phone = loginResult.phone;
    this.username = loginResult.username;
    this.token = loginResult.token;
    this.roles = loginResult.roles;
    this.permissions = loginResult.permissions;
  }
}
