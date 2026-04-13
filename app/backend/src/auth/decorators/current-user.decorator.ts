import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface AuthenticatedUser {
  sub: string;
  email?: string;
  username?: string;
  tokenVersion: number;
  refreshToken?: string;
}

type AuthenticatedRequest = {
  user?: AuthenticatedUser;
};

type CurrentUserData = keyof AuthenticatedUser | undefined;
type CurrentUserResult =
  | AuthenticatedUser
  | AuthenticatedUser[keyof AuthenticatedUser]
  | undefined;

export const CurrentUser = createParamDecorator<
  CurrentUserData,
  CurrentUserResult
>((data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
  const request = ctx
    .switchToHttp()
    .getRequest<unknown>() as AuthenticatedRequest;
  const user = request.user;
  if (!data) return user;

  return user?.[data];
});
