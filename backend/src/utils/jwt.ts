import jwt from 'jsonwebtoken';

export const signAccessToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
};

export const signRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { id: string };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { id: string };
};