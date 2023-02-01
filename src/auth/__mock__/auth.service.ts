import { tokensStub } from '../test/stubs/tokens.stub';

export const AuthService = jest.fn().mockReturnValue({
  signup: jest.fn().mockReturnValue(tokensStub()),
  signin: jest.fn().mockReturnValue(tokensStub()),
  logout: jest.fn(),
  refreshTokens: jest.fn().mockReturnValue(tokensStub()),
});
