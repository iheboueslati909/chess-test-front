import { User } from "./user.model";

export interface Invitation {
  id: number;
  fromUser: User;
  toUser: User;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}