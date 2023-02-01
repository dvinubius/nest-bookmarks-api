import { Test } from '@nestjs/testing';
import { AuthController } from '../../auth.controller';
import { AuthService } from '../../auth.service';
import { authStub } from '../stubs/auth.stub';
import { Tokens } from 'src/auth/types';
import { tokensStub } from '../stubs/tokens.stub';
import { userIdStub } from '../stubs/user-id.stub';
import { rtStub } from '../stubs/rt.stub';

jest.mock('../../auth.service');

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('Sign Up', () => {
    describe('When a user signs up', () => {
      let tokens: Tokens;
      beforeEach(async () => {
        tokens = await controller.signup(authStub());
      });
      it('then it should call AuthService', () => {
        expect(service.signup).toHaveBeenCalledWith(authStub());
      });

      it('then it should return tokens', () => {
        expect(tokens).toEqual(tokensStub());
      });
    });
  });

  describe('Sign In', () => {
    describe('When a user signs in', () => {
      let tokens: Tokens;
      beforeEach(async () => {
        tokens = await controller.signin(authStub());
      });
      it('then it should call AuthService', () => {
        expect(service.signin).toHaveBeenCalledWith(authStub());
      });

      it('then it should return tokens', () => {
        expect(tokens).toEqual(tokensStub());
      });
    });
  });

  describe('Logout', () => {
    describe('When a user logs out', () => {
      beforeEach(async () => {
        await controller.logout(userIdStub);
      });
      it('then it should call AuthService', () => {
        expect(service.logout).toHaveBeenCalledWith(userIdStub);
      });
    });
  });

  describe('Refresh Tokens', () => {
    describe('When a user refreshes tokens', () => {
      let tokens: Tokens;
      beforeEach(async () => {
        tokens = await controller.refreshTokens(userIdStub, rtStub);
      });
      it('then it should call AuthService', () => {
        expect(service.refreshTokens).toHaveBeenCalledWith(userIdStub, rtStub);
      });

      it('then it should return tokens', () => {
        expect(tokens).toEqual(tokensStub());
      });
    });
  });
});
